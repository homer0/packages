import type { Linter } from 'eslint';

export const esmRulesConfig: Linter.Config = {
  name: '@homer0: esm',
  languageOptions: {
    sourceType: 'module',
  },
  rules: {
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
    'import-x/no-unresolved': ['error', { commonjs: false, caseSensitive: true }],
  },
};
