import {
  browserConfig,
  esmConfig,
  nodeTsTestsConfig,
  nodeTsConfig,
  nodeConfig,
  testsConfig,
  tsConfig,
  jsdocConfig,
} from './configs/index.js';
import { PACKAGE_META, addPrettierConfigs } from './utils/index.js';

export default {
  meta: PACKAGE_META,
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
    jsdoc: jsdocConfig,
  },
};
