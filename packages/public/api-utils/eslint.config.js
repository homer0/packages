import { defineConfig } from 'eslint/config';
import { createConfig } from '@homer0/eslint-plugin/create';

export default defineConfig([
  createConfig({
    importUrl: import.meta.url,
    ignores: ['tests/**'],
    configs: ['node-ts-with-prettier'],
    extraneousDependencies: {
      bundledDependencies: ['@homer0/object-utils', '@types/urijs', 'urijs'],
    },
  }),
  createConfig({
    importUrl: import.meta.url,
    files: 'all-inside:./tests',
    configs: ['node-ts-tests-with-prettier'],
    tsConfigPath: './tests',
  }),
]);
