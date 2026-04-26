import { describe, expect, it } from 'vitest';

import xvideos from '../../src/index.js';

const assertVideo = (video: {
  duration: string;
  durationSeconds: number;
  videoId: string;
  profile: { name: string; url: string };
  thumbnailUrl: string;
  title: string;
  url: string;
  watchCount: number;
}) => {
  expect(typeof video.duration).toBe('string');
  expect(typeof video.durationSeconds).toBe('number');
  expect(video.durationSeconds).toBeGreaterThan(0);
  expect(video.videoId.startsWith('video')).toBe(true);
  expect(typeof video.profile.name).toBe('string');
  expect(typeof video.profile.url).toBe('string');
  expect(video.thumbnailUrl.startsWith('https://')).toBe(true);
  expect(video.title.length).toBeGreaterThan(0);
  expect(video.url.startsWith('https://')).toBe(true);
  expect(typeof video.watchCount).toBe('number');
};

const assertList = (
  list: {
    hasNext: () => boolean;
    hasPrevious: () => boolean;
    next: () => Promise<unknown>;
    pagination: { page: number; pages: number[] };
    previous: () => Promise<unknown>;
    refresh: () => Promise<unknown>;
    videos: Array<{
      duration: string;
      durationSeconds: number;
      videoId: string;
      profile: { name: string; url: string };
      thumbnailUrl: string;
      title: string;
      url: string;
      watchCount: number;
    }>;
  },
  page: number,
) => {
  expect(list.pagination.page).toBe(page);
  expect(Array.isArray(list.pagination.pages)).toBe(true);
  expect(list.pagination.pages.length).toBeGreaterThan(0);
  expect(typeof list.hasNext).toBe('function');
  expect(typeof list.hasPrevious).toBe('function');
  expect(typeof list.next).toBe('function');
  expect(typeof list.previous).toBe('function');
  expect(typeof list.refresh).toBe('function');
  expect(list.videos.length).toBeGreaterThan(0);
  assertVideo(list.videos[0]);
};

describe.sequential('live integration', () => {
  it('loads dashboard list', async () => {
    const list = await xvideos.videos.dashboard();

    assertList(list, 1);
  });

  it('loads fresh list', async () => {
    const list = await xvideos.videos.fresh();

    assertList(list, 1);
  });

  it('loads monthly best list', async () => {
    const list = await xvideos.videos.best();

    assertList(list, 1);
  });

  it('loads verified list', async () => {
    const list = await xvideos.videos.verified();

    assertList(list, 1);
  });

  it('loads search results and navigation', async () => {
    const list = await xvideos.videos.search({ k: 'test', page: 2 });

    assertList(list, 2);
    expect(list.hasNext()).toBe(true);
    expect(list.hasPrevious()).toBe(true);

    const previous = await list.previous();
    assertList(previous, 1);

    const next = await list.next();
    assertList(next, 3);
  });

  it('loads details for first search result', async () => {
    const list = await xvideos.videos.search({ k: 'test' });
    const detail = await xvideos.videos.details(list.videos[0]);

    expect(detail.title.length).toBeGreaterThan(0);
    expect(detail.url.startsWith('https://')).toBe(true);
    expect(typeof detail.videoId).toBe('string');
    expect(detail.videoId.startsWith('video')).toBe(true);
    expect(typeof detail.duration).toBe('string');
    expect(typeof detail.durationSeconds).toBe('number');
    expect(detail.durationSeconds).toBeGreaterThan(0);
    expect(Array.isArray(detail.thumbnailUrls)).toBe(true);
    expect(detail.thumbnailUrls.length).toBeGreaterThan(0);
    expect(detail.thumbnailUrls[0].startsWith('https://')).toBe(true);
    expect(typeof detail.watchCount).toBe('number');
    expect(detail.watchCount).toBeGreaterThan(0);
    expect(typeof detail.voteCount).toBe('number');
    expect(typeof detail.ratingPercent).toBe('number');
    expect(typeof detail.uploadDate).toBe('string');
    expect(typeof detail.description).toBe('string');
    expect(typeof detail.contentUrl).toBe('string');
    expect(Array.isArray(detail.tags)).toBe(true);
    expect(Array.isArray(detail.categories)).toBe(true);
    expect(typeof detail.videoType).toBe('string');
    expect(typeof detail.videoWidth).toBe('string');
    expect(detail.videoWidth.length).toBeGreaterThan(0);
    expect(typeof detail.videoHeight).toBe('string');
    expect(detail.videoHeight.length).toBeGreaterThan(0);
    expect(typeof detail.files.low).toBe('string');
    expect(typeof detail.files.high).toBe('string');
    expect(typeof detail.files.HLS).toBe('string');
    expect(typeof detail.files.thumb).toBe('string');
    expect(typeof detail.files.thumb69).toBe('string');
    expect(typeof detail.files.thumbSlide).toBe('string');
    expect(typeof detail.files.thumbSlideBig).toBe('string');
    expect(
      Boolean(detail.files.HLS || detail.files.high || detail.files.low),
    ).toBe(true);
  });

  it('loads batch details for the first two search results', async () => {
    const list = await xvideos.videos.search({ k: 'test' });
    const batch = await xvideos.videos.detailsMany(list.videos.slice(0, 2), {
      concurrency: 2,
      retries: 1,
    });

    expect(batch.items).toHaveLength(2);
    expect(batch.failures).toHaveLength(0);
    expect(batch.successes).toHaveLength(2);
    expect(batch.successes[0].videoId.startsWith('video')).toBe(true);
    expect(batch.successes[1].videoId.startsWith('video')).toBe(true);
  });

  it('rejects invalid pages', async () => {
    await expect(xvideos.videos.dashboard({ page: 0 })).rejects.toThrow(
      'Invalid page: 0',
    );
    await expect(
      xvideos.videos.search({ k: 'test', page: Number.MAX_SAFE_INTEGER + 1 }),
    ).rejects.toThrow(`Invalid page: ${Number.MAX_SAFE_INTEGER + 1}`);
  });
});
