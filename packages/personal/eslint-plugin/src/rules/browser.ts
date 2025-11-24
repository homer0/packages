import globals from 'globals';
import type { Config } from 'eslint/config';

export const browserRulesConfig: Config = {
  name: '@homer0: browser',
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
  rules: {
    /**
     * All configs extend from a node config, so in a browser context, we don't need this
     * valdiations.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-syntax.md
     */
    'n/no-unsupported-features/es-syntax': 'off',
    /**
     * All configs extend from a node config, so in a browser context, we don't need this
     * valdiations.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/node-builtins.md
     */
    'n/no-unsupported-features/node-builtins': 'off',
  },
};
