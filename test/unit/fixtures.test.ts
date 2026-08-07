import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { describe, expect, it } from 'vitest';
import { __private__ } from '../../src/videos.js';

/**
 * These fixtures are real pages captured from xvideos.com. They pin the
 * current HTML structure so a site layout change breaks these tests instead
 * of production code. Refresh with scripts/refresh-fixtures.sh.
 */
const readFixture = (name: string): string =>
  readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');

const unusedLoader = async (): Promise<never> => {
  throw new Error('unused');
};

describe('real HTML fixtures', () => {
  it('parses the dashboard listing fixture', () => {
    const html = readFixture('listing-dashboard.html');
    const result = __private__.buildListResult(1, html, unusedLoader);

    expect(result.videos.length).toBeGreaterThan(0);
    expect(result.videos[0]).toMatchObject({
      url: expect.stringContaining('/video.'),
      videoId: expect.stringContaining('video.'),
      title: expect.any(String),
      thumbnailUrl: expect.stringContaining('http'),
    });
    expect(result.pagination.pages.length).toBeGreaterThan(0);
  });

  it('parses the fresh listing fixture', () => {
    const html = readFixture('listing-fresh.html');
    const result = __private__.buildListResult(1, html, unusedLoader);

    expect(result.videos.length).toBeGreaterThan(0);
    expect(result.videos[0].profile.name.length).toBeGreaterThan(0);
  });

  it('parses the verified listing fixture', () => {
    const html = readFixture('listing-verified.html');
    const result = __private__.buildListResult(1, html, unusedLoader);

    expect(result.videos.length).toBeGreaterThan(0);
    expect(result.videos[0]).toMatchObject({
      url: expect.stringContaining('/video.'),
      videoId: expect.stringContaining('video.'),
    });
  });

  it('parses the best listing fixture', () => {
    const html = readFixture('listing-best.html');
    const result = __private__.buildListResult(1, html, unusedLoader);

    expect(result.videos.length).toBeGreaterThan(0);
    expect(result.pagination.pages.length).toBeGreaterThan(0);
    expect(result.videos[0].watchCount).toBeGreaterThan(0);
  });

  it('parses the category listing fixture', () => {
    const html = readFixture('listing-category.html');
    const result = __private__.buildListResult(1, html, unusedLoader);

    expect(result.videos.length).toBeGreaterThan(0);
    expect(result.pagination.pages.length).toBeGreaterThan(0);
  });

  it('parses the video detail fixture', () => {
    const html = readFixture('video-detail.html');
    const $ = load(html);
    const jsonLd = __private__.parseJsonLdVideoObject($);
    const files = __private__.extractFiles(
      html,
      __private__.readMeta($, 'og:image'),
    );

    expect(jsonLd).not.toEqual({});
    expect(files.HLS).toContain('http');
    expect(files.low).toContain('http');
    expect(files.high).toContain('http');
    expect(
      __private__.parseWatchCount(jsonLd, __private__.readDetailViews($, html)),
    ).toBeGreaterThan(0);
    expect(__private__.readMeta($, 'og:title').length).toBeGreaterThan(0);
    expect(__private__.readMeta($, 'og:duration').length).toBeGreaterThan(0);

    const videoUrl =
      __private__.readMeta($, 'og:url') ||
      'https://www.xvideos.com/video.example/title';
    expect(__private__.parseVideoId(videoUrl)).toMatch(/^video\./);
  });
});
