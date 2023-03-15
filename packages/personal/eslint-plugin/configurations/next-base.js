const typescript = require('./typescript');

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  ...typescript,
  extends: [
    'airbnb-base',
    ...['../rules/best-practices.js', '../rules/style.js'].map(require.resolve),
    ...typescript.extends,
  ],
};
