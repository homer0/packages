import { defineConfig } from 'eslint/config';
import { createConfig } from './dist/create/index.js';

export default defineConfig([
  createConfig({
    /**
     * The reason for this is that we are importing the plugin from `dist`, which triggers type
     * checking, which we don't want. The only alternative is to remove this file from the
     * `tsconfig.json`, and that would trigger an ESLint error if we are not ignoring this file.
     */
    ignores: ['eslint.config.js'],
    importUrl: import.meta.url,
    configs: ['node-ts-with-prettier'],
  }),
]);
