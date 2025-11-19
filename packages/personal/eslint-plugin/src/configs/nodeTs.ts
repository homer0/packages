import type { Config } from 'eslint/config';
import { nodeTsRulesConfig } from '../rules/index.js';
import { nodeConfig } from './node.js';
import { tsConfig } from './ts.js';

export const nodeTsConfig: Config[] = [...nodeConfig, ...tsConfig, nodeTsRulesConfig];
