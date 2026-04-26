import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            thresholds: {
              branches: 100,
              functions: 100,
              lines: 100,
              statements: 100,
            },
          },
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          fileParallelism: false,
          maxConcurrency: 1,
          retry: 1,
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      }),
    ],
  },
});
