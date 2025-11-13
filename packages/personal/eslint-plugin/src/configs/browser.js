import globals from 'globals';
import { baseRulesConfigs, baseLanguageOptionsConfig } from './base.js';
import transpilation from '../rules/transpilation.js';

export default [
  ...baseRulesConfigs,
  transpilation,
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
