import fs from 'node:fs';
import node from './configs/node.js';
import nodeTypescript from './configs/node-typescript.js';
import nodeTypescriptTests from './configs/node-typescript-tests.js';
import typescript from './configs/typescript.js';
import browser from './configs/browser.js';
import esm from './configs/esm.js';
import { addPrettier } from './utils.js';

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

const coreConfigs = Object.entries({
  browser,
  node,
  'node-typescript': nodeTypescript,
  'node-typescript-tests': nodeTypescriptTests,
}).reduce(
  (acc, [name, config]) => ({
    ...acc,
    [name]: config,
    [`${name}-with-prettier`]: addPrettier(config),
  }),
  {},
);

export default {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  configs: {
    ...coreConfigs,
    esm,
    typescript,
  },
};
