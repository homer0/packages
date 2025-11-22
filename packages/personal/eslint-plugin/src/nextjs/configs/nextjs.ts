import globals from 'globals';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import type { Config } from 'eslint/config';
import {
  baseRulesConfigs,
  basePluginsConfigs,
  baseLanguageOptionsConfig,
  tsConfig,
} from '../../configs/index.js';
import { nodeTsRulesConfig } from '../../rules/index.js';
import { reactStyleRulesConfig } from '../../react/rules/index.js';
import { nextjsIgnoresRulesConfig } from '../rules/index.js';

export const nextjsConfig: Config[] = [
  ...basePluginsConfigs,
  ...baseRulesConfigs,
  ...nextVitals,
  ...nextTs,
  ...tsConfig,
  nodeTsRulesConfig,
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
