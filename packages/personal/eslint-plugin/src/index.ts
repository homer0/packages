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

export default {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  configs: {
    ...addPrettierConfigs({
      browser: browserConfig,
      node: nodeConfig,
      'node-ts': nodeTsConfig,
      'node-ts-tests': nodeTsTestsConfig,
    }),
    esm: esmConfig,
    tests: testsConfig,
    ts: tsConfig,
  },
};
