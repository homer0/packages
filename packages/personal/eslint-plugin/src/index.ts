import fs from 'node:fs';
import {
  browserConfig,
  esmConfig,
  nodeTsTestsConfig,
  nodeTsConfig,
  nodeConfig,
  testsConfig,
  tsConfig,
} from './configs/index.js';

import { addPrettierConfigs } from './utils/index.js';

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

const coreConfigs = Object.entries({
  browser: browserConfig,
  node: nodeConfig,
  'node-ts': nodeTsConfig,
  'node-ts-tests': nodeTsTestsConfig,
}).reduce(
  (acc, [name, config]) => ({
    ...acc,
    [name]: config,
    [`${name}-with-prettier`]: addPrettierConfigs(config),
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
    esm: esmConfig,
    tests: testsConfig,
    ts: tsConfig,
  },
};
