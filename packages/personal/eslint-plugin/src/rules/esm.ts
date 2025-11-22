import type { Config } from 'eslint/config';

export const esmRulesConfig: Config = {
  name: '@homer0: esm',
  languageOptions: {
    sourceType: 'module',
  },
  rules: {
    /**
     * This is changed to never validate the extensions for TypeScript files, since the TS
     * compiler already handles that.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/extensions.md
     */
    'import-x/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'always',
        mjs: 'always',
        jsx: 'never',
        ts: 'never',
        mts: 'never',
        tsx: 'never',
      },
    ],
    /**
     * Just changed `commonjs` to `false` to avoid false positives when using ESM imports.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
     */
    'import-x/no-unresolved': ['error', { commonjs: false, caseSensitive: true }],
  },
};
