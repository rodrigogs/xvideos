import { type CheerioAPI, load } from 'cheerio';
import type { Element } from 'domhandler';
import base from './base.js';
import type {
  DetailsInput,
  DetailsManyOptions,
  SearchOptions,
  VideoDetailsBatchFailure,
  VideoDetailsBatchItem,
  VideoDetailsBatchResult,
  VideoDetailsResult,
  VideoFiles,
  VideoListResult,
  VideoSummary,
} from './types/videos.js';

export type {
  DetailsInput,
  DetailsManyOptions,
  Pagination,
  SearchOptions,
  VideoDetailsBatchFailure,
  VideoDetailsBatchItem,
  VideoDetailsBatchResult,
  VideoDetailsResult,
  VideoFiles,
  VideoListResult,
  VideoProfile,
  VideoSummary,
} from './types/videos.js';

const request = base.createRequest();

const normalizeText = (value: string | null | undefined): string => {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
};

const decodeEscapedValue = (value: string): string => {
  return value
    .replace(/\\u002f/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026|&amp;/gi, '&')
    .trim();
};

const assertPage = (page: number): void => {
  if (!Number.isInteger(page) || page < 1 || page > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid page: ${page}`);
  }
};

const ALLOWED_VIDEO_HOST = /(?:^|\.)xvideos\.com$/;

const assertVideoUrl = (url: string): void => {
  if (!url) {
    throw new Error('Invalid url');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid url');
  }

  if (
    parsed.protocol !== 'https:' ||
    !ALLOWED_VIDEO_HOST.test(parsed.hostname)
  ) {
    throw new Error('Invalid url');
  }
};

const uniqueSortedPages = (pages: number[], currentPage: number): number[] => {
  return Array.from(new Set([...pages, currentPage])).sort(
    (left, right) => left - right,
  );
};

const parsePages = ($: CheerioAPI): number[] => {
  const values = $('.pagination a')
    .map((_, element) => Number.parseInt(normalizeText($(element).text()), 10))
    .get();

  return values.filter((value): value is number => Number.isFinite(value));
};

const parseViews = ($video: ReturnType<CheerioAPI>): string => {
  const count = normalizeText(
    $video.find('.video-metadata .views-count').first().text(),
  );

  if (count) {
    return `${count} Views`;
  }

  const metadata = normalizeText(
    $video.find('.video-metadata, p.metadata').first().text(),
  );
  const match = metadata.match(/([0-9]+(?:[.,][0-9]+)?[KMB]?)(?=\s*Views?\b)/i);

  return match ? `${match[1]} Views` : '';
};

const parseVideo = ($: CheerioAPI, element: Element): VideoSummary | null => {
  const $video = $(element);
  const link = $video
    .find('.thumb-link[href*="/video"], .thumb > a[href*="/video"]')
    .first();
  const path = link.attr('href');

  if (!path) {
    return null;
  }

  const titleLink = $video
    .find('.thumb-under .title a, p.title > a, p:not(.metadata) a')
    .first();
  const titleNode = titleLink.clone();
  titleNode.find('.duration').remove();

  const profileLink = $video
    .find('.video-metadata a.name, .video-metadata a[href], p.metadata a[href]')
    .first();
  const profileName =
    normalizeText(profileLink.find('.name').first().text()) ||
    normalizeText(profileLink.text());
  const duration = normalizeText(
    $video
      .find(
        '.video-metadata .duration, .duration-container .duration, p.metadata .duration, p.title .duration',
      )
      .first()
      .text(),
  );
  const thumbnailCandidate = normalizeText(
    link.find('img').first().attr('data-src') ||
      link.find('img').first().attr('src') ||
      link.find('img').first().attr('data-srcset')?.split(/\s|,/)[0] ||
      '',
  );

  return {
    url: base.resolveUrl(path),
    videoId: parseVideoId(path),
    title:
      normalizeText(titleLink.attr('title')) || normalizeText(titleNode.text()),
    duration,
    durationSeconds: parseDurationSeconds(duration),
    thumbnailUrl: thumbnailCandidate ? base.resolveUrl(thumbnailCandidate) : '',
    profile: {
      name: profileName,
      url: base.resolveUrl(profileLink.attr('href')),
    },
    watchCount: parseNumberWithSuffix(parseViews($video)),
  };
};

const delay = async (ms: number): Promise<void> => {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const normalizeDetailsManyOptions = ({
  concurrency = 4,
  retries = 0,
  retryDelayMs = 0,
  minDelayMs = 0,
}: DetailsManyOptions = {}): Required<DetailsManyOptions> => {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`Invalid concurrency: ${concurrency}`);
  }

  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error(`Invalid retries: ${retries}`);
  }

  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    throw new Error(`Invalid retryDelayMs: ${retryDelayMs}`);
  }

  if (!Number.isFinite(minDelayMs) || minDelayMs < 0) {
    throw new Error(`Invalid minDelayMs: ${minDelayMs}`);
  }

  return {
    concurrency,
    retries,
    retryDelayMs,
    minDelayMs,
  };
};

const createStartGate = (minDelayMs: number): (() => Promise<void>) => {
  if (minDelayMs <= 0) {
    return async () => {};
  }

  let lastStartedAt: number | null = null;
  let queue = Promise.resolve();

  return async () => {
    let release!: () => void;
    const currentTurn = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previousTurn = queue;
    queue = currentTurn;

    await previousTurn;

    if (lastStartedAt !== null) {
      const waitMs = Math.max(0, lastStartedAt + minDelayMs - Date.now());
      await delay(waitMs);
    }

    lastStartedAt = Date.now();
    release();
  };
};

const retryDetails = async (
  input: DetailsInput,
  retries: number,
  retryDelayMs: number,
): Promise<VideoDetailsResult> => {
  let attempt = 0;

  while (true) {
    try {
      return await details(input);
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }

      attempt += 1;
      await delay(retryDelayMs);
    }
  }
};

const buildListResult = (
  page: number,
  html: string,
  loadPage: (targetPage: number) => Promise<VideoListResult>,
): VideoListResult => {
  const $ = load(html);
  const videos = $(
    '.thumb-block[data-id], .frame-block.thumb-block[data-id], .thumb-block.video[data-video]',
  )
    .map((_, element) => parseVideo($, element))
    .get()
    .filter((video): video is VideoSummary => Boolean(video));
  const pages = uniqueSortedPages(parsePages($), page);
  const minPage = Math.min(...pages);
  const maxPage = Math.max(...pages);

  return {
    videos,
    pagination: {
      page,
      pages,
    },
    refresh: () => loadPage(page),
    hasNext: () => page < maxPage,
    next: () => loadPage(page + 1),
    hasPrevious: () => page > minPage && page > 1,
    previous: () => loadPage(page - 1),
  };
};

const loadListingPage = async (
  page: number,
  candidates: string[],
  loadPage: (targetPage: number) => Promise<VideoListResult>,
): Promise<VideoListResult> => {
  let lastError: Error | undefined;

  for (const candidate of Array.from(new Set(candidates))) {
    try {
      const response = await request.get(candidate);
      const result = buildListResult(page, response.data, loadPage);

      if (result.videos.length > 0) {
        return result;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error(`Failed to load page ${page}`);
};

const createIndexQueryCandidates = (page: number): string[] => {
  if (page === 1) {
    return ['/'];
  }

  return [`/?p=${page - 1}`, `/?p=${page}`];
};

const dashboard = async ({
  page = 1,
}: {
  page?: number;
} = {}): Promise<VideoListResult> => {
  assertPage(page);

  return loadListingPage(page, createIndexQueryCandidates(page), (targetPage) =>
    dashboard({ page: targetPage }),
  );
};

const fresh = async ({
  page = 1,
}: {
  page?: number;
} = {}): Promise<VideoListResult> => {
  assertPage(page);

  const candidates = page === 1 ? ['/new', '/new/1'] : [`/new/${page}`];

  return loadListingPage(page, candidates, (targetPage) =>
    fresh({ page: targetPage }),
  );
};

const verified = async ({
  page = 1,
}: {
  page?: number;
} = {}): Promise<VideoListResult> => {
  assertPage(page);

  const candidates =
    page === 1
      ? ['/verified/videos', '/verified/videos/1']
      : [`/verified/videos/${page}`];

  return loadListingPage(page, candidates, (targetPage) =>
    verified({ page: targetPage }),
  );
};

const best = async ({
  year,
  month,
  page = 1,
}: {
  year?: string | number;
  month?: string | number;
  page?: number;
} = {}): Promise<VideoListResult> => {
  assertPage(page);

  const now = new Date();
  const bestYear = String(year ?? now.getFullYear());
  const bestMonth = String(month ?? now.getMonth() + 1).padStart(2, '0');
  const period = `${bestYear}-${bestMonth}`;
  const useDefaultRoute = year === undefined && month === undefined;
  const candidates =
    page === 1
      ? useDefaultRoute
        ? ['/best', `/best/${period}`, `/best/${period}/1`]
        : [`/best/${period}`, `/best/${period}/1`]
      : [`/best/${period}/${page}`, `/best/${period}/${page - 1}`];

  return loadListingPage(page, candidates, (targetPage) =>
    best({ year: bestYear, month: bestMonth, page: targetPage }),
  );
};

const createSearchCandidate = (
  page: number,
  pageValue: number | undefined,
  {
    k = '',
    sort = 'relevance',
    durf = 'allduration',
    datef = 'all',
    quality = 'all',
  }: SearchOptions,
): string => {
  const params = new URLSearchParams();

  if (pageValue !== undefined) {
    params.set('p', String(pageValue));
  }

  if (k) {
    params.set('k', k);
    params.set('sort', sort);
    params.set('durf', durf);
    params.set('datef', datef);
    params.set('quality', quality);
  }

  const query = params.toString();

  return query
    ? `/?${query}`
    : page === 1
      ? '/'
      : `/?p=${pageValue ?? page - 1}`;
};

const search = async ({
  page = 1,
  k = '',
  sort = 'relevance',
  durf = 'allduration',
  datef = 'all',
  quality = 'all',
}: SearchOptions = {}): Promise<VideoListResult> => {
  assertPage(page);

  const options = { k, sort, durf, datef, quality };
  const candidates =
    page === 1
      ? [createSearchCandidate(page, undefined, options)]
      : [
          createSearchCandidate(page, page - 1, options),
          createSearchCandidate(page, page, options),
        ];

  return loadListingPage(page, candidates, (targetPage) =>
    search({ ...options, page: targetPage }),
  );
};

const readMeta = ($: CheerioAPI, property: string): string => {
  return normalizeText($(`meta[property="${property}"]`).attr('content'));
};

const parseNumberWithSuffix = (value: string): number => {
  const match = normalizeText(value)
    .replace(/,/g, '')
    .match(/([0-9]+(?:\.[0-9]+)?)\s*([KMB])?/i);

  if (!match) {
    return 0;
  }

  const base = Number.parseFloat(match[1]);

  const suffix = match[2]?.toUpperCase();
  const multiplier =
    suffix === 'K'
      ? 1_000
      : suffix === 'M'
        ? 1_000_000
        : suffix === 'B'
          ? 1_000_000_000
          : 1;

  return Math.round(base * multiplier);
};

const parseDurationSeconds = (value: string): number => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return 0;
  }

  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }

  const isoMatch = normalized.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);

  if (isoMatch) {
    const hours = Number.parseInt(isoMatch[1] || '0', 10);
    const minutes = Number.parseInt(isoMatch[2] || '0', 10);
    const seconds = Number.parseInt(isoMatch[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  const units = Array.from(
    normalized.matchAll(
      /(\d+)\s*(h(?:ours?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?)/gi,
    ),
  );

  if (units.length === 0) {
    return 0;
  }

  return units.reduce((total, match) => {
    const amount = Number.parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('h')) {
      return total + amount * 3600;
    }

    if (unit.startsWith('m')) {
      return total + amount * 60;
    }

    return total + amount;
  }, 0);
};

const parseVideoId = (value: string): string => {
  const path = (() => {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  })();

  const segment = path
    .split('/')
    .filter(Boolean)
    .find((item) => item.startsWith('video'));

  return segment || '';
};

const parseStringArray = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return Array.from(
    new Set(
      values
        .filter((item): item is string => typeof item === 'string')
        .map((item) => normalizeText(item))
        .filter(Boolean),
    ),
  );
};

const findVideoObject = (input: unknown): Record<string, unknown> | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findVideoObject(item);

      if (found) {
        return found;
      }
    }

    return null;
  }

  const item = input as Record<string, unknown>;
  const type = item['@type'];

  if (
    type === 'VideoObject' ||
    (Array.isArray(type) && type.some((entry) => entry === 'VideoObject'))
  ) {
    return item;
  }

  return (
    findVideoObject(item['@graph']) ||
    findVideoObject(item.itemListElement) ||
    findVideoObject(item.mainEntity) ||
    null
  );
};

const parseJsonLdVideoObject = ($: CheerioAPI): Record<string, unknown> => {
  const scripts = $('script[type="application/ld+json"]')
    .map((_, element) => normalizeText($(element).text()))
    .get()
    .filter(Boolean);

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script) as unknown;
      const videoObject = findVideoObject(parsed);

      if (videoObject) {
        return videoObject;
      }
    } catch {
      // Ignore malformed JSON-LD blocks and keep searching for a valid VideoObject.
    }
  }

  return {};
};

const parseTaxonomy = ($: CheerioAPI, selector: string): string[] => {
  const values = $(selector)
    .map((_, element) => normalizeText($(element).text()))
    .get()
    .filter(Boolean);

  return Array.from(new Set(values));
};

const parseEngagement = (
  $: CheerioAPI,
  html: string,
): { ratingPercent: number; voteCount: number } => {
  const voteText =
    normalizeText($('[class*="rating"], [class*="vote"]').first().text()) ||
    html;
  const voteMatch = voteText.match(
    /([0-9]+(?:[.,][0-9]+)?\s*[KMB]?)\s*votes?/i,
  );
  const ratingMatch = voteText.match(/([0-9]+(?:\.[0-9]+)?)\s*%/i);

  return {
    voteCount: voteMatch ? parseNumberWithSuffix(voteMatch[1]) : 0,
    ratingPercent: ratingMatch ? Number.parseFloat(ratingMatch[1]) : 0,
  };
};

const parseWatchCount = (
  jsonLd: Record<string, unknown>,
  views: string,
): number => {
  const interactionStatistic = jsonLd.interactionStatistic;
  const candidates = Array.isArray(interactionStatistic)
    ? interactionStatistic
    : interactionStatistic
      ? [interactionStatistic]
      : [];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      const value = (candidate as Record<string, unknown>).userInteractionCount;

      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      const parsed = parseNumberWithSuffix(
        typeof value === 'string' ? value : '',
      );

      if (parsed > 0) {
        return parsed;
      }
    }
  }

  return parseNumberWithSuffix(views);
};

const readDetailViews = ($: CheerioAPI, html: string): string => {
  const directViews =
    normalizeText($('#v-views strong.mobile-hide').first().text()) ||
    normalizeText($('#v-views strong').first().text()) ||
    normalizeText($('#nb-views-number').text()) ||
    normalizeText($('.video-metadata .views').first().text()) ||
    normalizeText($('.video-infos .views').first().text());

  if (directViews) {
    return directViews;
  }

  const match = html.match(
    /id="v-views"[\s\S]*?<strong[^>]*>([^<]+)<\/strong>/i,
  );

  return normalizeText(match?.[1]);
};

const extractFirstMatch = (html: string, patterns: RegExp[]): string => {
  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeEscapedValue(match[1]);
    }
  }

  return '';
};

const extractFiles = (html: string, image: string): VideoFiles => {
  const files = {
    low: extractFirstMatch(html, [
      /html5player\.setVideoUrlLow\('([^']+)'/i,
      /html5player\.setVideoUrlLow\("([^"]+)"/i,
      /"videoUrlLow":"([^"]+)"/i,
      /"video_url_low":"([^"]+)"/i,
    ]),
    high: extractFirstMatch(html, [
      /html5player\.setVideoUrlHigh\('([^']+)'/i,
      /html5player\.setVideoUrlHigh\("([^"]+)"/i,
      /"videoUrlHigh":"([^"]+)"/i,
      /"video_url_high":"([^"]+)"/i,
    ]),
    HLS: (() => {
      const hls = extractFirstMatch(html, [
        /html5player\.setVideoHLS\('([^']+)'/i,
        /html5player\.setVideoHLS\("([^"]+)"/i,
        /"videoHLS":"([^"]+)"/i,
        /"video_hls":"([^"]+)"/i,
        /((?:https:)?\/\/[^"' ]+\.m3u8[^"' ]*)/i,
      ]);
      return hls.startsWith('//') ? `https:${hls}` : hls;
    })(),
    thumb:
      extractFirstMatch(html, [
        /html5player\.setThumbUrl\('([^']+)'/i,
        /html5player\.setThumbUrl\("([^"]+)"/i,
        /"thumbUrl":"([^"]+)"/i,
      ]) || image,
    thumb69: extractFirstMatch(html, [
      /html5player\.setThumbUrl169\('([^']+)'/i,
      /html5player\.setThumbUrl169\("([^"]+)"/i,
      /"thumbUrl169":"([^"]+)"/i,
    ]),
    thumbSlide: extractFirstMatch(html, [
      /html5player\.setThumbSlide\('([^']+)'/i,
      /html5player\.setThumbSlide\("([^"]+)"/i,
      /"thumbSlide":"([^"]+)"/i,
    ]),
    thumbSlideBig: extractFirstMatch(html, [
      /html5player\.setThumbSlideBig\('([^']+)'/i,
      /html5player\.setThumbSlideBig\("([^"]+)"/i,
      /"thumbSlideBig":"([^"]+)"/i,
    ]),
  };

  return files;
};

type VideoResolution = {
  width: number;
  height: number;
};

const parseResolutions = (manifest: string): VideoResolution[] => {
  return Array.from(manifest.matchAll(/RESOLUTION=(\d+)x(\d+)/gi), (match) => ({
    width: Number.parseInt(match[1], 10),
    height: Number.parseInt(match[2], 10),
  })).filter(
    (resolution) =>
      Number.isFinite(resolution.width) && Number.isFinite(resolution.height),
  );
};

const resolveVideoSize = async (
  files: VideoFiles,
  width: string,
  height: string,
): Promise<{ width: string; height: string }> => {
  if (width && height) {
    return { width, height };
  }

  if (!files.HLS) {
    return { width, height };
  }

  let hlsUrl: URL;
  try {
    hlsUrl = new URL(files.HLS);
  } catch {
    return { width, height };
  }

  if (hlsUrl.protocol !== 'https:') {
    return { width, height };
  }

  try {
    const manifestResponse = await request.get(files.HLS);
    const resolutions = parseResolutions(manifestResponse.data);

    if (resolutions.length === 0) {
      return { width, height };
    }

    const bestResolution = resolutions.reduce((best, current) => {
      return current.width * current.height > best.width * best.height
        ? current
        : best;
    });

    return {
      width: width || String(bestResolution.width),
      height: height || String(bestResolution.height),
    };
  } catch {
    return { width, height };
  }
};

const details = async ({ url }: DetailsInput): Promise<VideoDetailsResult> => {
  assertVideoUrl(url);

  const response = await request.get(url);
  const html = response.data;
  const $ = load(html);
  const jsonLd = parseJsonLdVideoObject($);
  const image = readMeta($, 'og:image');
  const files = extractFiles(html, image);
  const duration = readMeta($, 'og:duration');
  const engagement = parseEngagement($, html);
  const sizeMatch = html.match(
    /html5player\.setVideoSize\((\d+)\s*,\s*(\d+)\)/i,
  );
  const size = await resolveVideoSize(
    files,
    readMeta($, 'og:video:width') || sizeMatch?.[1] || '',
    readMeta($, 'og:video:height') || sizeMatch?.[2] || '',
  );

  return {
    title: readMeta($, 'og:title'),
    url,
    videoId: parseVideoId(url),
    duration,
    durationSeconds:
      parseDurationSeconds(
        typeof jsonLd.duration === 'string' ? jsonLd.duration : '',
      ) || parseDurationSeconds(duration),
    thumbnailUrls:
      parseStringArray(jsonLd.thumbnailUrl).length > 0
        ? parseStringArray(jsonLd.thumbnailUrl)
        : image
          ? [image]
          : [],
    watchCount: parseWatchCount(jsonLd, readDetailViews($, html)),
    voteCount: engagement.voteCount,
    ratingPercent: engagement.ratingPercent,
    videoType: readMeta($, 'og:video:type') || readMeta($, 'og:type'),
    videoWidth: size.width,
    videoHeight: size.height,
    uploadDate:
      typeof jsonLd.uploadDate === 'string'
        ? normalizeText(jsonLd.uploadDate)
        : '',
    description:
      typeof jsonLd.description === 'string'
        ? normalizeText(jsonLd.description)
        : '',
    contentUrl:
      typeof jsonLd.contentUrl === 'string'
        ? normalizeText(jsonLd.contentUrl)
        : '',
    tags: parseTaxonomy($, 'a[href*="/tags/"]'),
    categories: parseTaxonomy($, 'a[href*="/c/"]'),
    files,
  };
};

const detailsMany = async (
  inputs: DetailsInput[],
  options: DetailsManyOptions = {},
): Promise<VideoDetailsBatchResult> => {
  const normalizedInputs = inputs.map(({ url }) => ({ url }));

  if (normalizedInputs.length === 0) {
    return {
      items: [],
      successes: [],
      failures: [],
    };
  }

  const { concurrency, retries, retryDelayMs, minDelayMs } =
    normalizeDetailsManyOptions(options);
  const reserveStart = createStartGate(minDelayMs);
  const items = new Array<VideoDetailsBatchItem>(normalizedInputs.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (index >= normalizedInputs.length) {
        return;
      }

      const input = normalizedInputs[index];
      await reserveStart();

      try {
        const value = await retryDetails(input, retries, retryDelayMs);
        items[index] = {
          input,
          ok: true,
          value,
        };
      } catch (error) {
        items[index] = {
          input,
          ok: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, normalizedInputs.length) },
      async () => worker(),
    ),
  );

  const failures = items.filter(
    (item): item is VideoDetailsBatchFailure => !item.ok,
  );

  return {
    items,
    successes: items.flatMap((item) => (item.ok ? [item.value] : [])),
    failures,
  };
};

const videos = {
  best,
  dashboard,
  details,
  detailsMany,
  fresh,
  search,
  verified,
};

/** @internal */
export const __private__ = {
  assertPage,
  assertVideoUrl,
  buildListResult,
  createStartGate,
  createIndexQueryCandidates,
  createSearchCandidate,
  decodeEscapedValue,
  delay,
  extractFiles,
  extractFirstMatch,
  loadListingPage,
  normalizeText,
  normalizeDetailsManyOptions,
  parsePages,
  parseResolutions,
  parseVideo,
  parseViews,
  parseDurationSeconds,
  parseEngagement,
  parseJsonLdVideoObject,
  parseNumberWithSuffix,
  parseStringArray,
  parseTaxonomy,
  parseVideoId,
  parseWatchCount,
  readDetailViews,
  readMeta,
  retryDetails,
  resolveVideoSize,
  uniqueSortedPages,
};

export default videos;
