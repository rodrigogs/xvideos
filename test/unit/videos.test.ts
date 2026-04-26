import { load } from 'cheerio';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestGet = vi.fn();

vi.mock('../../src/base.js', () => {
  const BASE_URL = 'https://www.xvideos.com';

  return {
    BASE_URL,
    createRequest: () => ({
      get: requestGet,
    }),
    default: {
      BASE_URL,
      createRequest: () => ({
        get: requestGet,
      }),
      resolveUrl: (path: string | undefined) => {
        if (!path) {
          return '';
        }

        return new URL(path, BASE_URL).toString();
      },
    },
    resolveUrl: (path: string | undefined) => {
      if (!path) {
        return '';
      }

      return new URL(path, BASE_URL).toString();
    },
  };
});

const { __private__, default: videos } = await import('../../src/videos.js');
const { default: index } = await import('../../src/index.js');

const classicListingHtml = `
<div class="pagination"><a>1</a><a>2</a><a>3</a></div>
<div class="frame-block thumb-block" data-id="1">
	<div class="thumb-inside">
		<div class="thumb"><a href="/video.one/title"></a></div>
	</div>
	<div class="thumb-under">
		<p class="title"><a href="/video.one/title" title="Video One">Video One <span class="duration">5 min</span></a></p>
		<p class="metadata"><span class="bg"><span class="duration">5 min</span><span><a href="/profiles/tester"><span class="name">Tester</span></a><span><span class="sprfluous"> - </span> 1.2M <span class="sprfluous">Views</span></span><span class="sprfluous"> - </span></span></span></p>
	</div>
</div>
<div class="frame-block thumb-block" data-id="2">
	<div class="thumb-inside">
		<div class="thumb"><a href="/video.two/title"></a></div>
	</div>
	<div class="thumb-under">
		<p class="title"><a href="/video.two/title">Video Two <span class="duration">17 sec</span></a></p>
		<p class="metadata"><span class="bg"><span class="duration">17 sec</span><span><a href="/profiles/plain">Plain Profile</a><span class="sprfluous"> - </span></span></span></p>
	</div>
</div>
<div class="frame-block thumb-block" data-id="3"><div class="thumb-under"><p class="title"><a title="Broken">Broken</a></p></div></div>
`;

const bestListingHtml = `
<main id="best">
	<div class="pagination"><a>1</a><a>2</a></div>
	<div class="thumb-block video" data-video="1">
		<a class="thumb-link" href="/video.best/title"></a>
		<div class="thumb-under"><p class="title"><a href="/video.best/title" title="Best Video">Best Video</a></p></div>
		<div class="video-metadata"><a class="name" href="/profiles/best"><span class="name">Bestie</span></a><span class="views-count">7.5M</span></div>
		<div class="duration-container"><span class="duration">10 min</span></div>
	</div>
</main>
`;

const detailHtml = `
<meta property="og:title" content="Fixture Title" />
<meta property="og:duration" content="302" />
<meta property="og:image" content="https://cdn.example/thumb.jpg" />
<meta property="og:type" content="video.movie" />
<div id="v-views"><span class="icon-f icf-eye"></span><strong class="mobile-hide">177,775</strong></div>
<script>
html5player.setVideoUrlLow('https://cdn.example/low.mp4');
html5player.setVideoUrlHigh("https://cdn.example/high.mp4");
html5player.setVideoHLS('https://cdn.example/master.m3u8');
html5player.setThumbUrl('https://cdn.example/thumb.jpg');
html5player.setThumbUrl169('https://cdn.example/thumb169.jpg');
html5player.setThumbSlide('https://cdn.example/slide.jpg');
html5player.setThumbSlideBig('https://cdn.example/slide-big.jpg');
</script>
`;

const manifest = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=763904,RESOLUTION=854x480
hls-480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1327104,RESOLUTION=1280x720
hls-720p.m3u8
`;

const descendingManifest = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1327104,RESOLUTION=1280x720
hls-720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=763904,RESOLUTION=854x480
hls-480p.m3u8
`;

describe('videos helpers', () => {
  beforeEach(() => {
    requestGet.mockReset();
  });

  it('exports facade from index', () => {
    expect(index.videos).toBe(videos);
  });

  it('normalizes text and decodes escaped values', () => {
    expect(__private__.normalizeText('  many \n spaces  ')).toBe('many spaces');
    expect(__private__.normalizeText(null)).toBe('');
    expect(
      __private__.decodeEscapedValue(
        'https:\\/\\/cdn.example\\/x\\u0026y&amp;z ',
      ),
    ).toBe('https://cdn.example/x&y&z');
  });

  it('validates pages and deduplicates page arrays', () => {
    expect(() => __private__.assertPage(0)).toThrow('Invalid page: 0');
    expect(() => __private__.assertPage(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      `Invalid page: ${Number.MAX_SAFE_INTEGER + 1}`,
    );
    expect(() => __private__.assertPage(2)).not.toThrow();
    expect(__private__.uniqueSortedPages([3, 1, 3], 2)).toEqual([1, 2, 3]);
  });

  it('parses page numbers and list views', () => {
    const pagination$ = load(
      '<div class="pagination"><a>3</a><a>1</a><a>x</a></div>',
    );
    expect(__private__.parsePages(pagination$)).toEqual([3, 1]);

    const counted$ = load(
      '<div class="video-metadata"><span class="views-count">7.9M</span></div>',
    );
    expect(__private__.parseViews(counted$('div'))).toBe('7.9M Views');

    const metadata$ = load(
      '<div><p class="metadata"><span class="bg"><span class="duration">9 min</span><span><a href="/alex_adams"><span class="name">Alex Adams</span></a><span><span class="sprfluous"> - </span> 33.9M <span class="sprfluous">Views</span></span><span class="sprfluous"> - </span></span></span></p></div>',
    );
    expect(__private__.parseViews(metadata$('div'))).toBe('33.9M Views');

    const missing$ = load(
      '<p class="metadata"><span class="bg">Missing</span></p>',
    );
    expect(__private__.parseViews(missing$('p'))).toBe('');
  });

  it('parses classic and v4 video cards', () => {
    const classic$ = load(classicListingHtml);
    const classicVideo = __private__.parseVideo(
      classic$,
      classic$('.frame-block.thumb-block').get(0),
    );

    expect(classicVideo).toEqual({
      url: 'https://www.xvideos.com/video.one/title',
      path: '/video.one/title',
      title: 'Video One',
      duration: '5 min',
      profile: {
        name: 'Tester',
        url: 'https://www.xvideos.com/profiles/tester',
      },
      views: '1.2M Views',
    });

    const v4$ = load(bestListingHtml);
    const v4Video = __private__.parseVideo(
      v4$,
      v4$('.thumb-block.video').get(0),
    );
    expect(v4Video?.views).toBe('7.5M Views');
    expect(v4Video?.profile.name).toBe('Bestie');

    expect(
      __private__.parseVideo(
        classic$,
        classic$('.frame-block.thumb-block[data-id="3"]').get(0),
      ),
    ).toBeNull();
  });

  it('builds list results and navigation helpers', async () => {
    const list = __private__.buildListResult(
      2,
      classicListingHtml,
      async (targetPage) => ({
        videos: [],
        pagination: {
          page: targetPage,
          pages: [1, 2, 3],
        },
        refresh: async () => {
          throw new Error('not-used');
        },
        hasNext: () => false,
        next: async () => {
          throw new Error('not-used');
        },
        hasPrevious: () => false,
        previous: async () => {
          throw new Error('not-used');
        },
      }),
    );

    expect(list.videos).toHaveLength(2);
    expect(list.pagination).toEqual({
      page: 2,
      pages: [1, 2, 3],
    });
    expect(list.hasNext()).toBe(true);
    expect(list.hasPrevious()).toBe(true);
    await expect(list.next()).resolves.toMatchObject({
      pagination: {
        page: 3,
      },
    });
    await expect(list.previous()).resolves.toMatchObject({
      pagination: {
        page: 1,
      },
    });
    await expect(list.refresh()).resolves.toMatchObject({
      pagination: {
        page: 2,
      },
    });

    const noPagination = __private__.buildListResult(
      1,
      '<div class="frame-block thumb-block" data-id="9"><div class="thumb"><a href="/video.simple/title"></a></div><div class="thumb-under"><p class="title"><a href="/video.simple/title" title="Simple">Simple <span class="duration">1 min</span></a></p><p class="metadata"><span class="bg"><span class="duration">1 min</span><span><a href="/profiles/simple"><span class="name">Simple</span></a></span></span></p></div></div>',
      async (targetPage) => ({
        videos: [],
        pagination: {
          page: targetPage,
          pages: [targetPage],
        },
        refresh: async () => {
          throw new Error('not-used');
        },
        hasNext: () => false,
        next: async () => {
          throw new Error('not-used');
        },
        hasPrevious: () => false,
        previous: async () => {
          throw new Error('not-used');
        },
      }),
    );
    expect(noPagination.hasNext()).toBe(false);
    expect(noPagination.hasPrevious()).toBe(false);
  });

  it('loads listing pages across candidates and preserves last errors', async () => {
    requestGet
      .mockRejectedValueOnce(new Error('first failed'))
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/?p=1',
      });

    const list = await __private__.loadListingPage(
      2,
      ['/broken', '/ok'],
      async () => {
        throw new Error('not-used');
      },
    );
    expect(list.videos).toHaveLength(2);

    requestGet.mockResolvedValue({
      data: '<div class="pagination"><a>1</a></div>',
      statusCode: 200,
      url: 'https://www.xvideos.com/empty',
    });
    await expect(
      __private__.loadListingPage(1, ['/empty'], async () => {
        throw new Error('not-used');
      }),
    ).rejects.toThrow('Failed to load page 1');

    requestGet.mockRejectedValue(new Error('all failed'));
    await expect(
      __private__.loadListingPage(1, ['/fail'], async () => {
        throw new Error('not-used');
      }),
    ).rejects.toThrow('all failed');

    requestGet.mockRejectedValue('plain failure');
    await expect(
      __private__.loadListingPage(1, ['/string-fail'], async () => {
        throw new Error('not-used');
      }),
    ).rejects.toThrow('plain failure');
  });

  it('builds route candidates', () => {
    expect(__private__.createIndexQueryCandidates(1)).toEqual(['/']);
    expect(__private__.createIndexQueryCandidates(3)).toEqual([
      '/?p=2',
      '/?p=3',
    ]);
    expect(
      __private__.createSearchCandidate(1, undefined, {
        k: '',
        sort: 'relevance',
        durf: 'allduration',
        datef: 'all',
        quality: 'all',
      }),
    ).toBe('/');
    expect(
      __private__.createSearchCandidate(2, 1, {
        k: 'test',
        sort: 'rating',
        durf: '3-10min',
        datef: 'week',
        quality: 'hd',
      }),
    ).toBe('/?p=1&k=test&sort=rating&durf=3-10min&datef=week&quality=hd');
    expect(
      __private__.createSearchCandidate(3, undefined, {
        k: '',
        sort: 'relevance',
        durf: 'allduration',
        datef: 'all',
        quality: 'all',
      }),
    ).toBe('/?p=2');
  });

  it('reads detail metadata and file urls', async () => {
    const $ = load(detailHtml);

    expect(__private__.readMeta($, 'og:title')).toBe('Fixture Title');
    expect(__private__.readDetailViews($, detailHtml)).toBe('177,775');
    expect(
      __private__.readDetailViews(
        load('<div></div>'),
        '<div id="v-views"><strong>12k</strong></div>',
      ),
    ).toBe('12k');
    expect(
      __private__.extractFirstMatch('prefix VALUE suffix', [
        /(VALUE)/,
        /(missing)/,
      ]),
    ).toBe('VALUE');
    expect(__private__.extractFirstMatch('prefix', [/(missing)/])).toBe('');

    expect(
      __private__.extractFiles(detailHtml, 'https://cdn.example/fallback.jpg'),
    ).toEqual({
      low: 'https://cdn.example/low.mp4',
      high: 'https://cdn.example/high.mp4',
      HLS: 'https://cdn.example/master.m3u8',
      thumb: 'https://cdn.example/thumb.jpg',
      thumb69: 'https://cdn.example/thumb169.jpg',
      thumbSlide: 'https://cdn.example/slide.jpg',
      thumbSlideBig: 'https://cdn.example/slide-big.jpg',
    });

    expect(
      __private__.extractFiles('', 'https://cdn.example/fallback.jpg').thumb,
    ).toBe('https://cdn.example/fallback.jpg');

    expect(
      __private__.extractFiles(
        'html5player.setVideoHLS("//cdn.example/master.m3u8")',
        '',
      ).HLS,
    ).toBe('https://cdn.example/master.m3u8');

    expect(__private__.parseResolutions(manifest)).toEqual([
      { width: 854, height: 480 },
      { width: 1280, height: 720 },
    ]);

    await expect(
      __private__.resolveVideoSize(
        {
          low: '',
          high: '',
          HLS: '',
          thumb: '',
          thumb69: '',
          thumbSlide: '',
          thumbSlideBig: '',
        },
        '320',
        '180',
      ),
    ).resolves.toEqual({ width: '320', height: '180' });

    await expect(
      __private__.resolveVideoSize(
        {
          low: '',
          high: '',
          HLS: '',
          thumb: '',
          thumb69: '',
          thumbSlide: '',
          thumbSlideBig: '',
        },
        '',
        '',
      ),
    ).resolves.toEqual({ width: '', height: '' });

    requestGet.mockResolvedValueOnce({
      data: manifest,
      statusCode: 200,
      url: 'https://cdn.example/master.m3u8',
    });
    await expect(
      __private__.resolveVideoSize(
        {
          low: '',
          high: '',
          HLS: 'https://cdn.example/master.m3u8',
          thumb: '',
          thumb69: '',
          thumbSlide: '',
          thumbSlideBig: '',
        },
        '',
        '',
      ),
    ).resolves.toEqual({ width: '1280', height: '720' });

    requestGet.mockResolvedValueOnce({
      data: '#EXTM3U',
      statusCode: 200,
      url: 'https://cdn.example/master.m3u8',
    });
    await expect(
      __private__.resolveVideoSize(
        {
          low: '',
          high: '',
          HLS: 'https://cdn.example/master.m3u8',
          thumb: '',
          thumb69: '',
          thumbSlide: '',
          thumbSlideBig: '',
        },
        '',
        '',
      ),
    ).resolves.toEqual({ width: '', height: '' });

    requestGet.mockRejectedValueOnce(new Error('manifest failed'));
    await expect(
      __private__.resolveVideoSize(
        {
          low: '',
          high: '',
          HLS: 'https://cdn.example/master.m3u8',
          thumb: '',
          thumb69: '',
          thumbSlide: '',
          thumbSlideBig: '',
        },
        '',
        '',
      ),
    ).resolves.toEqual({ width: '', height: '' });

    requestGet.mockResolvedValueOnce({
      data: descendingManifest,
      statusCode: 200,
      url: 'https://cdn.example/master.m3u8',
    });
    await expect(
      __private__.resolveVideoSize(
        {
          low: '',
          high: '',
          HLS: 'https://cdn.example/master.m3u8',
          thumb: '',
          thumb69: '',
          thumbSlide: '',
          thumbSlideBig: '',
        },
        '',
        '',
      ),
    ).resolves.toEqual({ width: '1280', height: '720' });
  });

  it('loads public endpoints with mocked html', async () => {
    requestGet.mockResolvedValueOnce({
      data: classicListingHtml,
      statusCode: 200,
      url: 'https://www.xvideos.com/',
    });
    await expect(videos.dashboard()).resolves.toMatchObject({
      pagination: { page: 1, pages: [1, 2, 3] },
    });

    requestGet.mockResolvedValueOnce({
      data: classicListingHtml,
      statusCode: 200,
      url: 'https://www.xvideos.com/new/2',
    });
    await expect(videos.fresh({ page: 2 })).resolves.toMatchObject({
      pagination: { page: 2 },
    });

    requestGet
      .mockRejectedValueOnce(new Error('verified miss'))
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/verified/videos/1',
      });
    await expect(videos.verified()).resolves.toMatchObject({
      pagination: { page: 1 },
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T00:00:00Z'));
    requestGet
      .mockResolvedValueOnce({
        data: '<main id="best"></main>',
        statusCode: 200,
        url: 'https://www.xvideos.com/best',
      })
      .mockResolvedValueOnce({
        data: bestListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/best/2026-04',
      });
    await expect(videos.best()).resolves.toMatchObject({
      pagination: { page: 1, pages: [1, 2] },
    });
    vi.useRealTimers();

    requestGet
      .mockResolvedValueOnce({
        data: '<div class="pagination"><a>1</a></div>',
        statusCode: 200,
        url: 'https://www.xvideos.com/?p=1&k=test',
      })
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/?p=2&k=test',
      });
    await expect(videos.search({ k: 'test', page: 2 })).resolves.toMatchObject({
      pagination: { page: 2 },
    });

    requestGet
      .mockResolvedValueOnce({
        data: detailHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/video.one/title',
      })
      .mockResolvedValueOnce({
        data: manifest,
        statusCode: 200,
        url: 'https://cdn.example/master.m3u8',
      });
    await expect(
      videos.details({ url: 'https://www.xvideos.com/video.one/title' }),
    ).resolves.toEqual({
      title: 'Fixture Title',
      url: 'https://www.xvideos.com/video.one/title',
      duration: '302',
      image: 'https://cdn.example/thumb.jpg',
      views: '177,775',
      videoType: 'video.movie',
      videoWidth: '1280',
      videoHeight: '720',
      files: {
        low: 'https://cdn.example/low.mp4',
        high: 'https://cdn.example/high.mp4',
        HLS: 'https://cdn.example/master.m3u8',
        thumb: 'https://cdn.example/thumb.jpg',
        thumb69: 'https://cdn.example/thumb169.jpg',
        thumbSlide: 'https://cdn.example/slide.jpg',
        thumbSlideBig: 'https://cdn.example/slide-big.jpg',
      },
    });

    await expect(videos.details({ url: '' })).rejects.toThrow('Invalid url');
    await expect(
      videos.details({ url: 'http://www.xvideos.com/video.one/title' }),
    ).rejects.toThrow('Invalid url');
    await expect(
      videos.details({ url: 'https://evil.com/video.one/title' }),
    ).rejects.toThrow('Invalid url');
  });

  it('re-enters public wrappers through refresh callbacks', async () => {
    requestGet
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/',
      })
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/',
      });
    const dashboardList = await videos.dashboard();
    await expect(dashboardList.refresh()).resolves.toMatchObject({
      pagination: { page: 1 },
    });

    requestGet
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/new',
      })
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/new',
      });
    const freshList = await videos.fresh();
    await expect(freshList.refresh()).resolves.toMatchObject({
      pagination: { page: 1 },
    });

    requestGet
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/verified/videos/2',
      })
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/verified/videos/2',
      });
    const verifiedList = await videos.verified({ page: 2 });
    await expect(verifiedList.refresh()).resolves.toMatchObject({
      pagination: { page: 2 },
    });

    requestGet
      .mockResolvedValueOnce({
        data: bestListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/best/2026-04/2',
      })
      .mockResolvedValueOnce({
        data: bestListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/best/2026-04/2',
      });
    const bestList = await videos.best({ year: 2026, month: 4, page: 2 });
    await expect(bestList.refresh()).resolves.toMatchObject({
      pagination: { page: 2 },
    });

    requestGet
      .mockResolvedValueOnce({
        data: bestListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/best/2026-04',
      })
      .mockResolvedValueOnce({
        data: bestListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/best/2026-04',
      });
    const explicitBest = await videos.best({ year: 2026, month: 4 });
    await expect(explicitBest.refresh()).resolves.toMatchObject({
      pagination: { page: 1 },
    });

    requestGet
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/?k=test',
      })
      .mockResolvedValueOnce({
        data: classicListingHtml,
        statusCode: 200,
        url: 'https://www.xvideos.com/?k=test',
      });
    const searchList = await videos.search({ k: 'test' });
    await expect(searchList.refresh()).resolves.toMatchObject({
      pagination: { page: 1 },
    });
  });
});
