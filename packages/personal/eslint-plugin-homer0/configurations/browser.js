module.exports = {
  env: {
    browser: true,
  },
  extends: [
    './base.js',
    '../rules/transpilation.js',
  ].map(require.resolve),
};
