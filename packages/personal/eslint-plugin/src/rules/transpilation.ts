import type { Linter } from 'eslint';

export const transpilationRulesConfig: Linter.Config = {
  name: '@homer0: transpilation',
  languageOptions: {
    globals: {
      global: true,
    },
  },
  rules: {
    /**
     * In transpilation scenarios, it's common to have paths that the linter cannot
     * resolve, especially when using module aliasing or custom resolution strategies.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
     */
    'import-x/no-unresolved': 'off',
  },
};
