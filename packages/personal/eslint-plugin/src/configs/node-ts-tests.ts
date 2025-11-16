import type { Linter } from 'eslint';
import { nodeConfig } from './node.js';
import { tsConfig } from './ts.js';
import { testsConfig } from './tests.js';

export const nodeTsTestsConfig: Linter.Config[] = [
  ...nodeConfig,
  ...tsConfig,
  ...testsConfig,
];
