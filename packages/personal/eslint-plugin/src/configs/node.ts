import globals from 'globals';
import type { Config } from 'eslint/config';
import {
  baseRulesConfigs,
  basePluginsConfigs,
  baseLanguageOptionsConfig,
} from './base.js';

export const nodeConfig: Config[] = [
  ...basePluginsConfigs,
  ...baseRulesConfigs,
  {
    ...baseLanguageOptionsConfig,
    languageOptions: {
      ...baseLanguageOptionsConfig.languageOptions,
      globals: {
        ...globals.es2023,
        ...globals.node,
      },
    },
  },
];
