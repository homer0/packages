import type { Linter } from 'eslint';
import { errorsRulesConfig as base } from '../airbnb/index.js';

export const errorsRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: errors',
  rules: {
    ...base.rules,
    /**
     * `airbnb(error)` -> `off`.
     *
     * This is related to the change for `no-restricted-syntax` rule; I use `for...of`
     * loops to do async operations sequentially quite often, and I don't want to be
     * blocked by this rule.
     *
     * @see https://eslint.org/docs/latest/rules/no-await-in-loop
     */
    'no-await-in-loop': 'off',
  },
};
