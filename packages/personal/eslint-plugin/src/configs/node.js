import nodePlugin from 'eslint-plugin-n';
import globals from 'globals';
import { ignoreByEnvVar } from '../utils.js';
import { baseRulesConfigs, baseLanguageOptionsConfig } from './base.js';

export default [
  ...ignoreByEnvVar(),
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
