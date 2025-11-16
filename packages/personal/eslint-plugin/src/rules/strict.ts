import type { Linter } from 'eslint';
import { strictRulesConfig as base } from '../airbnb/index.js';

export const strictRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: strict',
};
