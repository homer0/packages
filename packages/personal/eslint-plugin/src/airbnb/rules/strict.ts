import type { Config } from 'eslint/config';

export const strictRulesConfig: Config = {
  rules: {
    // transpiler inserts `'use strict';` for us
    // https://eslint.org/docs/rules/strict
    strict: ['error', 'never'],
  },
};
