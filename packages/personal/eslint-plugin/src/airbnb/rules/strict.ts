import type { Linter } from 'eslint';

export const strictRulesConfig: Linter.Config = {
  rules: {
    // transpiler inserts `'use strict';` for us
    // https://eslint.org/docs/rules/strict
    strict: ['error', 'never'],
  },
};
