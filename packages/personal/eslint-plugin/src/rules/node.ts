import globals from 'globals';
import type { Linter } from 'eslint';
import { nodeRulesConfig as base } from '../airbnb/index.js';

export const nodeRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: node',
  languageOptions: {
    globals: {
      ...globals.es2023,
    },
  },
  rules: {
    ...base.rules,
    strict: 'off',
    'n/handle-callback-err': ['error', '^(err|error|\\w+Error)$'],
    'n/no-mixed-requires': 'error',
    'n/no-process-env': 'error',
    'n/no-unpublished-require': 'off',
    'n/no-unpublished-import': 'off',
    'n/shebang': 'off',
    'import-x/no-extraneous-dependencies': 'off',
  },
};
