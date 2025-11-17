import type { Linter } from 'eslint';
import { nodeRulesConfig as base } from './node.js';

export const nodeTsRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: node-ts',
  rules: {
    ...base.rules,
    /**
     * The TS compiler will handle the module syntax.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-syntax.md
     */
    'n/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    /**
     * The TS compiler will handle missing imports.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-missing-import.md
     */
    'n/no-missing-import': 'off',
  },
};
