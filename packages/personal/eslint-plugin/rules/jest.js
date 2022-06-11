module.exports = {
  rules: {
    'import/no-unresolved': 'off',
    'import/no-absolute-path': 'off',
    'import/first': 'off',
    'import/extensions': 'off',
    'node/no-missing-require': 'off',
    'no-magic-numbers': 'off',
  },
  globals: {
    module: true,
    process: true,
  },
};
