const base = require('./configurations/base');
const browser = require('./configurations/browser');
const jest = require('./configurations/jest');
const jestNodeTypeScript = require('./configurations/jest-node-typescript');
const jsdoc = require('./configurations/jsdoc');
const nextBase = require('./configurations/next-base');
const node = require('./configurations/node');
const nodeTypeScript = require('./configurations/node-typescript');
const react = require('./configurations/react');
const svelte = require('./configurations/svelte');
const svelteWithPrettier = require('./configurations/svelte-with-prettier');
const typescript = require('./configurations/typescript');
const { addPrettier } = require('./utils');

const coreConfigs = Object.entries({
  browser,
  jest,
  'jest-node-typescript': jestNodeTypeScript,
  'next-base': nextBase,
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
    svelte,
    'svelte-with-prettier': svelteWithPrettier,
  },
};
