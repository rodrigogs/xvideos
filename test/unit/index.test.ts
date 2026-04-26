import { describe, expect, it } from 'vitest';

import index from '../../src/index.js';

describe('index facade', () => {
  it('exports videos api', () => {
    expect(index).toHaveProperty('videos');
    expect(typeof index.videos.dashboard).toBe('function');
    expect(typeof index.videos.details).toBe('function');
  });
});
