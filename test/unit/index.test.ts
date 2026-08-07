import { beforeEach, describe, expect, it, vi } from 'vitest';

const { configureRequest } = vi.hoisted(() => ({
  configureRequest: vi.fn(),
}));

vi.mock('../../src/base.js', () => ({
  BASE_URL: 'https://www.xvideos.com',
  configureRequest,
  createRequest: () => ({ get: vi.fn() }),
  resolveUrl: (path: string | undefined) => path ?? '',
  default: {
    BASE_URL: 'https://www.xvideos.com',
    configureRequest,
    createRequest: () => ({ get: vi.fn() }),
    resolveUrl: (path: string | undefined) => path ?? '',
  },
}));

import index from '../../src/index.js';

describe('index facade', () => {
  beforeEach(() => {
    configureRequest.mockClear();
  });

  it('exports videos api', () => {
    expect(index).toHaveProperty('videos');
    expect(typeof index.videos.dashboard).toBe('function');
    expect(typeof index.videos.details).toBe('function');
  });

  it('exposes configure() on the public api', () => {
    index.configure({ minRequestIntervalMs: 250, proxyUrl: 'http://p:8080' });

    expect(configureRequest).toHaveBeenCalledWith({
      minRequestIntervalMs: 250,
      proxyUrl: 'http://p:8080',
    });

    index.configure({ minRequestIntervalMs: 0 });

    expect(configureRequest).toHaveBeenLastCalledWith({
      minRequestIntervalMs: 0,
      proxyUrl: undefined,
    });

    index.configure({});

    expect(configureRequest).toHaveBeenLastCalledWith({
      minRequestIntervalMs: 0,
      proxyUrl: undefined,
    });
  });
});
