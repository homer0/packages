const nodeTypescript = require('./node-typescript');

module.exports = {
  ...nodeTypescript,
  env: {
    ...nodeTypescript.env,
  },
  extends: [...nodeTypescript.extends, require.resolve('../rules/testing.js')],
  globals: {
    module: true,
    process: true,
  },
};
