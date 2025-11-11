import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }) as Plugin,
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules/**'],
    globals: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: resolve('./coverage'),
      include: ['src/**/*.{ts,tsx,js}'],
      exclude: ['types.ts', 'index.d.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});
