import type { Linter } from 'eslint';

export const transpilationRulesConfig: Linter.Config = {
  languageOptions: {
    globals: {
      global: true,
    },
  },
  rules: {
    'import-x/no-unresolved': 'off',
    'import-x/no-extraneous-dependencies': 'off',
    'import-x/prefer-default-export': 'off',
  },
};
