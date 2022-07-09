const preset = require('@homer0/eslint-plugin/presets/typescript');

module.exports = preset({
  rootDir: __dirname,
  configs: ['browser-with-prettier', 'typescript'],
});
