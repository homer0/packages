const typescript = require('./typescript');

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  ...typescript,
  extends: [
    'airbnb-base',
    ...[
      '../rules/best-practices.js',
      '../rules/errors.js',
      '../rules/transpilation.js',
      '../rules/style.js',
      '../rules/react.js',
    ].map(require.resolve),
    ...typescript.extends,
  ],
  overrides: [
    ...(typescript.overrides || []),
    {
      files: ['**/*.slice.ts'],
      rules: {
        'no-param-reassign': 'off',
      },
    },
  ],
};
