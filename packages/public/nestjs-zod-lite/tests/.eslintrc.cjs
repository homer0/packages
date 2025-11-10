const preset = require('@homer0/eslint-plugin/presets/typescript');

module.exports = {
  ...preset({
    rootDir: __dirname,
    configs: ['jest-node-typescript-with-prettier'],
  }),
  rules: {
    'node/no-missing-import': 'off',
  },
};
