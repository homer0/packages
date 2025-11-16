import type { Linter } from 'eslint';
import { es6RulesConfig as base } from '../airbnb/index.js';

export const es6RulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: es6',
};
