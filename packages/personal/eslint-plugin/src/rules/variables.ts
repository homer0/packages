import type { Config } from 'eslint/config';
import { variablesRulesConfig as base } from '../airbnb/index.js';

export const variablesRulesConfig: Config = {
  ...base,
  name: '@homer0: variables',
};
