import type { Config } from 'eslint/config';
import { nodeConfig } from './node.js';
import { tsConfig } from './ts.js';

export const nodeTsConfig: Config[] = [...nodeConfig, ...tsConfig];
