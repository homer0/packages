import nodePlugin from 'eslint-plugin-n';
import globals from 'globals';
import type { Linter } from 'eslint';
import { loadIgnorePathByEnvVar } from '../utils/index.js';
import {
  baseRulesConfigs,
  basePluginsConfigs,
  baseLanguageOptionsConfig,
} from './base.js';

export const nodeConfig: Linter.Config[] = [
  ...loadIgnorePathByEnvVar(),
  ...basePluginsConfigs,
  nodePlugin.configs['flat/recommended-module'],
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
