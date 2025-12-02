import globals from 'globals';
import type { Config } from 'eslint/config';
import { browserRulesConfig } from '../rules/index.js';
import {
  baseRulesConfigs,
  basePluginsConfigs,
  baseLanguageOptionsConfig,
} from './base.js';

export const browserConfig: Config[] = [
  ...basePluginsConfigs,
  ...baseRulesConfigs,
  browserRulesConfig,
  {
    ...baseLanguageOptionsConfig,
    languageOptions: {
      ...baseLanguageOptionsConfig.languageOptions,
      globals: {
        ...globals.es2023,
        ...globals.browser,
      },
    },
  },
];
