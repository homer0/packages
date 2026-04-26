import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    react(),
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', tsx: true },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
      module: { type: 'es6' },
    }) as Plugin,
  ],
  oxc: false,
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
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
