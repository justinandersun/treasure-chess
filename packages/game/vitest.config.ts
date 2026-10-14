import { defineConfig } from 'vitest/config';

// `pnpm bench` runs the benchmarks in bench/; normal runs only the unit tests in src/.
export default defineConfig({
  test: {
    include: process.env.BENCH ? ['bench/**/*.test.ts'] : ['src/**/*.test.ts'],
    testTimeout: process.env.BENCH ? 600_000 : 5_000,
  },
});
