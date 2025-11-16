import type { Linter } from 'eslint';
import { variablesRulesConfig as base } from '../airbnb/index.js';

export const variablesRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: variables',
};
