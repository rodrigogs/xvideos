import { describe, expect, it, vi } from 'vitest';

const gotScraping = vi.fn();

vi.mock('got-scraping', () => ({
  gotScraping,
}));

describe('base default transport', () => {
  it('uses got-scraping when transport not injected', async () => {
    const { createRequest } = await import('../../src/base.js');

    gotScraping.mockResolvedValueOnce({
      body: 'ok',
      statusCode: 200,
      url: 'https://www.xvideos.com/default',
    });

    await expect(createRequest().get('/default')).resolves.toEqual({
      data: 'ok',
      statusCode: 200,
      url: 'https://www.xvideos.com/default',
    });
    expect(gotScraping).toHaveBeenCalledTimes(1);
  });
});
