module.exports = {
  rules: {
    'import/no-unresolved': 'off',
    'import/no-absolute-path': 'off',
    'import/first': 'off',
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'node/no-missing-require': 'off',
    'no-magic-numbers': 'off',
    'max-classes-per-file': 'off',
  },
  globals: {
    module: true,
    process: true,
  },
};
