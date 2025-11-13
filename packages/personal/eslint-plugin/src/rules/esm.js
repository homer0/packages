export default {
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
      },
    ],
    'import-x/no-unresolved': ['error', { commonjs: false, caseSensitive: true }],
  },
};
