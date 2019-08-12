module.exports = {
  env: {
    node: true,
  },
  plugins: ['node'],
  extends: [
    'plugin:node/recommended',
    ...[
      './base.js',
      '../rules/node.js',
    ].map(require.resolve),
  ],
};
