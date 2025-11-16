import { defineConfig } from 'eslint/config';
import { createTsConfig } from './dist/presets/index.js';

export default defineConfig([
  createTsConfig({
    importUrl: import.meta.url,
    configs: ['node-ts-with-prettier'],
  }),
]);
