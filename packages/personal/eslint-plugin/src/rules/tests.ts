import type { Linter } from 'eslint';

export const testsRulesConfig: Linter.Config = {
  name: '@homer0: tests',
  rules: {
    'import-x/no-unresolved': 'off',
    'import-x/no-absolute-path': 'off',
    'import-x/first': 'off',
    'import-x/extensions': 'off',
    'import-x/no-extraneous-dependencies': 'off',
    'n/no-missing-require': 'off',
    'n/no-missing-import': 'off',
    'no-magic-numbers': 'off',
    'max-classes-per-file': 'off',
  },
};
