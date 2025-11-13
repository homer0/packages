import nodePlugin from 'eslint-plugin-n';
import globals from 'globals';
import { baseRulesConfigs, baseLanguageOptionsConfig } from './base.js';
import transpilation from '../rules/transpilation.js';

export default [
  nodePlugin.configs['flat/recommended-script'],
  ...baseRulesConfigs,
  transpilation,
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
