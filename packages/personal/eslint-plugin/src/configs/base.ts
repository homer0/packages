import nodePlugin from 'eslint-plugin-n';
import type { Linter } from 'eslint';
import {
  bestPracticesRulesConfig,
  errorsRulesConfig,
  nodeRulesConfig,
  styleRulesConfig,
  variablesRulesConfig,
  es6RulesConfig,
  importsRulesConfig,
  strictRulesConfig,
} from '../rules/index.js';
import {
  importXPluginConfig,
  nPluginConfig,
  sortClassMembersPluginConfig,
} from '../plugins/index.js';

export const baseRulesConfigs: Linter.Config[] = [
  nodePlugin.configs['flat/recommended-module'],
  bestPracticesRulesConfig,
  errorsRulesConfig,
  nodeRulesConfig,
  styleRulesConfig,
  variablesRulesConfig,
  es6RulesConfig,
  importsRulesConfig,
  strictRulesConfig,
];

export const basePluginsConfigs: Linter.Config[] = [
  importXPluginConfig,
  nPluginConfig,
  sortClassMembersPluginConfig,
];

export const baseLanguageOptionsConfig: Linter.Config = {
  rules: {},
  languageOptions: {
    sourceType: 'module',
    parserOptions: {
      ecmaVersion: 2023, // Node 20
      sourceType: 'module',
    },
  },
};
