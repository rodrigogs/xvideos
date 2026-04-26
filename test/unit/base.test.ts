import { describe, expect, it, vi } from 'vitest';

import {
  BASE_URL,
  createRequest,
  delay,
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
    const promise = delay(25);
    await vi.advanceTimersByTimeAsync(25);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
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
        sleep,
        transport,
      }).get('/retry'),
    ).rejects.toThrow('again');
    expect(transport).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 750);
    expect(sleep).toHaveBeenNthCalledWith(2, 1500);
  });
});
