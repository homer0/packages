module.exports = {
  env: {
    node: true,
  },
  plugins: ['node'],
  extends: [
    'plugin:node/recommended',
    './defaults.js',
    './rules/node.js',
  ],
};
