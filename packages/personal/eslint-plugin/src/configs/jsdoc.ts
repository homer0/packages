import type { Linter } from 'eslint';
import { jsdocPluginConfig } from '../plugins/index.js';
import { jsdocRulesConfig } from '../rules/index.js';

export const jsdocConfig: Linter.Config[] = [jsdocPluginConfig, jsdocRulesConfig];
