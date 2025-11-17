import { defineConfig } from 'eslint/config';
import { createTsConfig } from '@homer0/eslint-plugin/presets';

export default defineConfig([
  createTsConfig({
    importUrl: import.meta.url,
    ignores: ['tests/**'],
    configs: ['browser-with-prettier', 'ts'],
    extraneousDependencies: {
      bundledDependencies: ['@homer0/deep-assign'],
    },
  }),
  createTsConfig({
    importUrl: import.meta.url,
    files: 'all-inside:./tests',
    configs: ['node-ts-tests-with-prettier'],
    tsConfigPath: './tests',
  }),
]);
