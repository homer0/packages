import type { Config } from 'eslint/config';
import { nodeConfig } from './node.js';
import { tsConfig } from './ts.js';
import { testsConfig } from './tests.js';

export const nodeTsTestsConfig: Config[] = [...nodeConfig, ...tsConfig, ...testsConfig];
