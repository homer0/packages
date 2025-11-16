import type { Linter } from 'eslint';

export const reactRulesConfig: Linter.Config = {
  rules: {
    'no-use-before-define': 'off',
  },
};
