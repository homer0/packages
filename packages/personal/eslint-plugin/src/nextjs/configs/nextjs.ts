import globals from 'globals';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import type { Config } from 'eslint/config';
import { loadIgnorePathByEnvVar } from '../../utils/index.js';
import { reactStyleRulesConfig } from '../../react/rules/index.js';
import {
  baseRulesConfigs,
  basePluginsConfigs,
  baseLanguageOptionsConfig,
} from '../../configs/index.js';
import { nextjsIgnoresRulesConfig } from '../rules/index.js';

export const nextjsConfig: Config[] = [
  ...loadIgnorePathByEnvVar(),
  ...basePluginsConfigs,
  ...baseRulesConfigs,
  ...nextVitals,
  ...nextTs,
  reactStyleRulesConfig,
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
  nextjsIgnoresRulesConfig,
];
