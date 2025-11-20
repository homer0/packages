import { defineConfig } from 'eslint/config';
import { createConfig } from './local-config/index.js';

export default defineConfig([
  createConfig({
    /**
     * The reason for this is that we are importing the plugin from `dist`, which triggers type
     * checking, and we don't want. The only alternative is to remove this file from the
     * `tsconfig.json`, and that would trigger an ESLint error if we are not ignoring this file.
     * The `local-config` is another workaround for something similar: we are importing `.js` file
     * using a relative path from the `dist` folder, so it doesn't get the proper types, and the
     * autocompletion doesn't work. The `local-config/index.js` re-exports from `dist` so that
     * we can use it here, and it has a `index.d.ts` that exports the types from `src` in order
     * to have proper autocompletion.
     */
    ignores: ['eslint.config.js', 'local-config/**'],
    importUrl: import.meta.url,
    configs: ['node-ts-with-prettier'],
  }),
]);
