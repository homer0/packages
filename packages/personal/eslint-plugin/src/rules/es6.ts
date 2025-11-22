import type { Config } from 'eslint/config';
import { es6RulesConfig as base } from '../airbnb/index.js';

export const es6RulesConfig: Config = {
  ...base,
  name: '@homer0: es6',
};
