import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BASE_URL,
  computeRetryDelay,
  configureRequest,
  createRequest,
  delay,
  resetSharedThrottle,
  resolveUrl,
  shouldRetry,
} from '../../src/base.js';

describe('base helpers', () => {
  it('resolves empty and relative urls', () => {
    expect(resolveUrl(undefined)).toBe('');
    expect(resolveUrl('/video.test')).toBe(`${BASE_URL}/video.test`);
    expect(resolveUrl('https://cdn.example/video.mp4')).toBe(
      'https://cdn.example/video.mp4',
    );
  });

  it('identifies retryable errors', () => {
    expect(
      shouldRetry(
        Object.assign(new Error('timeout'), { name: 'TimeoutError' }),
      ),
    ).toBe(true);
    expect(
      shouldRetry(Object.assign(new Error('reset'), { code: 'ECONNRESET' })),
    ).toBe(true);
    expect(shouldRetry(new Error('boom'))).toBe(false);
    expect(shouldRetry('boom')).toBe(false);
  });

  it('waits using delay', async () => {
    vi.useFakeTimers();
    try {
      const promise = delay(25);
      await vi.advanceTimersByTimeAsync(25);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries retryable failures and stringifies non-string bodies', async () => {
    const transport = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
      )
      .mockResolvedValueOnce({
        body: 123,
        statusCode: 200,
        url: `${BASE_URL}/ok`,
      });
    const sleep = vi.fn().mockResolvedValue(undefined);

    const response = await createRequest({
      headers: { cookie: 'a=b' },
      random: () => 1,
      sleep,
      transport,
    }).get('/ok');

    expect(response).toEqual({
      data: '123',
      statusCode: 200,
      url: `${BASE_URL}/ok`,
    });
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport).toHaveBeenLastCalledWith({
      url: `${BASE_URL}/ok`,
      headers: expect.objectContaining({
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': expect.stringContaining('Mozilla/5.0'),
        cookie: 'a=b',
      }),
      http2: false,
      responseType: 'text',
      throwHttpErrors: true,
      retry: {
        limit: 0,
      },
      timeout: {
        request: 15_000,
      },
    });
    expect(sleep).toHaveBeenCalledWith(750);
  });

  it('throws non-retryable failures immediately', async () => {
    const transport = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(createRequest({ transport }).get('/fail')).rejects.toThrow(
      'boom',
    );
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('throws after max retry attempts', async () => {
    const retryable = Object.assign(new Error('again'), {
      code: 'ECONNREFUSED',
    });
    const transport = vi.fn().mockRejectedValue(retryable);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      createRequest({
        random: () => 1,
        sleep,
        transport,
      }).get('/retry'),
    ).rejects.toThrow('again');
    expect(transport).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 750);
    expect(sleep).toHaveBeenNthCalledWith(2, 1500);
  });
});

describe('crawl ergonomics', () => {
  afterEach(() => {
    resetSharedThrottle();
  });

  it('computes jittered retry backoff within the exponential window', () => {
    expect(computeRetryDelay(1, () => 0)).toBe(0);
    expect(computeRetryDelay(1, () => 1)).toBe(750);
    expect(computeRetryDelay(2, () => 1)).toBe(1500);
    expect(computeRetryDelay(3, () => 1)).toBe(3000);
    expect(computeRetryDelay(3, () => 0.5)).toBe(1500);
  });

  it('passes a per-request proxy url to the transport', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/proxy`,
    });
    const request = createRequest({
      proxyUrl: 'http://proxy.local:8080',
      transport,
    });

    await request.get('/proxy');

    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        proxyUrl: 'http://proxy.local:8080',
      }),
    );
  });

  it('throttles request starts with a shared minimum interval', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/throttled`,
    });
    const sleep = vi.fn().mockResolvedValue(undefined);
    let now = 1_000;
    const request = createRequest({
      minRequestIntervalMs: 500,
      now: () => now,
      sleep,
      transport,
    });

    await request.get('/throttled'); // first request: no wait
    expect(sleep).not.toHaveBeenCalled();

    now += 300; // 300ms later — must wait 200ms
    await request.get('/throttled');
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenLastCalledWith(200);

    now += 700; // 700ms later — no wait needed
    await request.get('/throttled');
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('shares the throttle across request instances', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/shared`,
    });
    const sleep = vi.fn().mockResolvedValue(undefined);
    let now = 5_000;

    const first = createRequest({
      minRequestIntervalMs: 1_000,
      now: () => now,
      sleep,
      transport,
    });
    const second = createRequest({ now: () => now, sleep, transport });

    await first.get('/shared'); // t=5000
    now += 200;
    await second.get('/shared'); // t=5200 — must wait 800ms (shared state)

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenLastCalledWith(800);
  });

  it('takes the largest requested interval across instances', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/largest`,
    });
    const sleep = vi.fn().mockResolvedValue(undefined);
    let now = 10_000;

    createRequest({
      minRequestIntervalMs: 400,
      now: () => now,
      sleep,
      transport,
    });
    createRequest({
      minRequestIntervalMs: 900,
      now: () => now,
      sleep,
      transport,
    });

    const third = createRequest({ now: () => now, sleep, transport });

    await third.get('/largest'); // first request: no wait
    now += 500; // within the 900ms window
    await third.get('/largest');

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenLastCalledWith(400);
  });

  it('serializes concurrent request starts through the shared throttle', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/concurrent`,
    });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const now = 1_000;

    const request = createRequest({
      minRequestIntervalMs: 500,
      now: () => now,
      sleep,
      transport,
    });

    // All three calls are in-flight at t=1000. Each must reserve its own
    // slot synchronously (1000, 1500, 2000) instead of recomputing the same
    // stale-anchor wait and firing together.
    await Promise.all([
      request.get('/concurrent'),
      request.get('/concurrent'),
      request.get('/concurrent'),
    ]);

    expect(sleep).toHaveBeenNthCalledWith(1, 500);
    expect(sleep).toHaveBeenNthCalledWith(2, 1_000);
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it('applies the shared config from configureRequest to plain clients', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/configured`,
    });
    const sleep = vi.fn().mockResolvedValue(undefined);
    let now = 20_000;

    configureRequest({ minRequestIntervalMs: 700 });

    const request = createRequest({ now: () => now, sleep, transport });

    await request.get('/configured'); // first request: no wait
    now += 300; // within the 700ms window
    await request.get('/configured');

    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenLastCalledWith(400);
  });

  it('routes plain clients through the shared proxy url', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/shared-proxy`,
    });

    configureRequest({ proxyUrl: 'http://shared-proxy:3128' });

    const request = createRequest({ transport });

    await request.get('/shared-proxy');

    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        proxyUrl: 'http://shared-proxy:3128',
      }),
    );
  });

  it('resetSharedThrottle clears config and the last request timestamp', async () => {
    const transport = vi.fn().mockResolvedValue({
      body: 'ok',
      statusCode: 200,
      url: `${BASE_URL}/reset`,
    });
    const sleep = vi.fn().mockResolvedValue(undefined);
    let now = 1_000;

    configureRequest({ minRequestIntervalMs: 300 });
    const request = createRequest({ now: () => now, sleep, transport });

    await request.get('/reset'); // t=1000, no wait
    now += 100; // t=1100 — inside the window, would wait 200ms
    resetSharedThrottle();
    await request.get('/reset');

    expect(sleep).not.toHaveBeenCalled();
    expect(transport).toHaveBeenCalledTimes(2);
  });
});
