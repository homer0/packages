import type { Config } from 'eslint/config';
import { jsdocPluginConfig } from '../plugins/index.js';
import { jsdocRulesConfig } from '../rules/index.js';

export const jsdocConfig: Config[] = [jsdocPluginConfig, jsdocRulesConfig];
