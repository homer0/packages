import type { Linter } from 'eslint';

export const reactRulesConfig: Linter.Config = {
  name: '@homer0: react',
  rules: {
    'no-use-before-define': 'off',
  },
};
