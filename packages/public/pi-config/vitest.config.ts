import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    fsModuleCache: true,
    unstubGlobals: true,
    unstubEnvs: true,
    globals: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: resolve('./coverage'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});
