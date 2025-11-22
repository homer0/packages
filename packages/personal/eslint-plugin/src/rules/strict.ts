import type { Config } from 'eslint/config';
import { strictRulesConfig as base } from '../airbnb/index.js';

export const strictRulesConfig: Config = {
  ...base,
  name: '@homer0: strict',
};
