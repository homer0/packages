const node = require('./node');
const typescript = require('./typescript');

module.exports = {
  ...node,
  ...typescript,
  plugins: [...node.plugins, ...typescript.plugins],
  extends: [
    ...node.extends,
    ...typescript.extends,
    require.resolve('../rules/node-typescript.js'),
  ],
};
