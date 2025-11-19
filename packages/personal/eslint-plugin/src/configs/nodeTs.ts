import type { Linter } from 'eslint';
import { nodeTsRulesConfig } from '../rules/index.js';
import { nodeConfig } from './node.js';
import { tsConfig } from './ts.js';

export const nodeTsConfig: Linter.Config[] = [
  ...nodeConfig,
  ...tsConfig,
  nodeTsRulesConfig,
];
