const nodeTypescript = require('./node-typescript');

module.exports = {
  ...nodeTypescript,
  env: {
    ...nodeTypescript.env,
    jest: true,
  },
  extends: [...nodeTypescript.extends, require.resolve('../rules/jest.js')],
  globals: {
    spyOn: true,
  },
};
