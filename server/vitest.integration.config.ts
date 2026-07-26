import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.integration-spec.ts'],
    hookTimeout: 10_000,
    testTimeout: 10_000,
  },
});
