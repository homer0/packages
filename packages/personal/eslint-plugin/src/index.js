import fs from 'node:fs';
import node from './configs/node.js';
import browser from './configs/browser.js';
import esm from './configs/esm.js';
import { addPrettier } from './utils.js';

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

const coreConfigs = Object.entries({
  browser,
  node,
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
  },
};
