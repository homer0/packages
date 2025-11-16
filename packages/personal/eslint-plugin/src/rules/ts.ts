import type { Linter } from 'eslint';

export const tsRulesConfig: Linter.Config = {
  rules: {
    'sort-class-members/sort-class-members': 'off',
    'import-x/extensions': 'off',
    'import-x/prefer-default-export': 'off',
    'import-x/no-unresolved': 'off',
    '@typescript-eslint/dot-notation': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': 'allow-with-description',
      },
    ],
    'lines-between-class-members': 'off',
    'no-useless-constructor': 'off',
    'no-unused-vars': 'off',
    'no-empty-function': 'off',
    'dot-notation': 'off',
  },
};
