import { defineConfig } from 'eslint/config';
import { createConfig } from '@homer0/eslint-plugin/create';

export default defineConfig([
  createConfig({
    importUrl: import.meta.url,
    ignores: ['packages/**'],
    configs: ['node-ts-with-prettier'],
  }),
]);
