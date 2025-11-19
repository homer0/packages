import type { Config } from 'eslint/config';

export const bundlingRulesConfig: Config = {
  name: '@homer0: bundling',
  languageOptions: {
    globals: {
      global: true,
    },
  },
  rules: {
    /**
     * In bundling scenarios, it's common to have paths that the linter cannot resolve,
     * especially when using module aliasing or custom resolution strategies.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
     */
    'import-x/no-unresolved': 'off',
  },
};
