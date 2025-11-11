import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules/**'],
    globals: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: resolve('./coverage'),
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['{types,index}.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});
