const base = require('./configurations/base');
const browser = require('./configurations/browser');
const jest = require('./configurations/jest');
const jsdoc = require('./configurations/jsdoc');
const node = require('./configurations/node');
const nodeTypeScript = require('./configurations/node-typescript');
const react = require('./configurations/react');
const typescript = require('./configurations/typescript');
const { addPrettier } = require('./utils');

const coreConfigs = Object.entries({
  browser,
  jest,
  node,
  'node-typescript': nodeTypeScript,
  react,
}).reduce(
  (acc, [name, config]) => ({
    ...acc,
    [name]: config,
    [`${name}-with-prettier`]: addPrettier(config),
  }),
  {},
);

module.exports = {
  configs: {
    ...coreConfigs,
    base,
    jsdoc,
    typescript,
  },
};
