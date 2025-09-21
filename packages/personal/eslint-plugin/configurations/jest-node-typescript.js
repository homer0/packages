const nodeTypescript = require('./node-typescript');

module.exports = {
  ...nodeTypescript,
  env: {
    ...nodeTypescript.env,
    jest: true,
  },
  extends: [...nodeTypescript.extends, require.resolve('../rules/testing.js')],
  globals: {
    spyOn: true,
    module: true,
    process: true,
  },
};
