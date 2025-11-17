import { defineConfig } from 'eslint/config';
import { createTsConfig } from '@homer0/eslint-plugin/presets';

export default defineConfig([
  createTsConfig({
    importUrl: import.meta.url,
    ignores: ['packages/**'],
    configs: ['node-ts-with-prettier'],
  }),
]);
