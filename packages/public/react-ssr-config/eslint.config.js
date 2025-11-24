import { defineConfig } from 'eslint/config';
import { createReactConfig } from '@homer0/eslint-plugin/react/create';

export default defineConfig([
  createReactConfig({
    importUrl: import.meta.url,
    ignores: ['tests/**'],
  }),
  createReactConfig({
    importUrl: import.meta.url,
    files: 'all-inside:./tests',
    tsConfigPath: './tests',
    tests: true,
  }),
]);
