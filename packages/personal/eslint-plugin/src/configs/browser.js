import globals from 'globals';
import { ignoreByEnvVar } from '../utils.js';
import transpilation from '../rules/transpilation.js';
import { baseRulesConfigs, baseLanguageOptionsConfig } from './base.js';

export default [
  ...ignoreByEnvVar(),
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
