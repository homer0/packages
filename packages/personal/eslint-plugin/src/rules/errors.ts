import type { Linter } from 'eslint';
import { errorsRulesConfig as base } from '../airbnb/index.js';

export const errorsRulesConfig: Linter.Config = {
  ...base,
  rules: {
    ...base.rules,
    'no-await-in-loop': 'off',
  },
};
