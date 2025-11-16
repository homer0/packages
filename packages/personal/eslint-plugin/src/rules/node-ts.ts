import type { Linter } from 'eslint';
import { nodeRulesConfig as base } from '../airbnb/index.js';

export const nodeTsRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: node-ts',
  rules: {
    ...base.rules,
    'n/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    'n/no-unpublished-import': 'off',
    'n/no-missing-import': 'off',
  },
};
