import globals from 'globals';
import type { Linter } from 'eslint';
import { loadIgnorePathByEnvVar } from '../utils/index.js';
import { transpilationRulesConfig } from '../rules/index.js';
import {
  baseRulesConfigs,
  basePluginsConfigs,
  baseLanguageOptionsConfig,
} from './base.js';

export const browserConfig: Linter.Config[] = [
  ...loadIgnorePathByEnvVar(),
  ...basePluginsConfigs,
  ...baseRulesConfigs,
  transpilationRulesConfig,
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
