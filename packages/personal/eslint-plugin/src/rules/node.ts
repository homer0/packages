import globals from 'globals';
import type { Config } from 'eslint/config';
import { nodeRulesConfig as base } from '../airbnb/index.js';

export const nodeRulesConfig: Config = {
  ...base,
  name: '@homer0: node',
  languageOptions: {
    globals: {
      ...globals.es2023,
    },
  },
  rules: {
    ...base.rules,
    /**
     * Disables strict mode enforcement. In Node.js, modules are in strict mode by
     * default.
     *
     * @see http://eslint.org/docs/latest/rules/strict
     */
    strict: 'off',
    /**
     * `airbnb(off)` -> `error`.
     *
     * I consider error handling a "required good practice" on every project.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/handle-callback-err.md
     */
    'n/handle-callback-err': ['error', '^(err|error|\\w+Error)$'],
    /**
     * `airbnb(off)` -> `error`.
     *
     * It helps to organize the code a little bit.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-mixed-requires.md
     */
    'n/no-mixed-requires': 'error',
    /**
     * `airbnb(off)` -> `error`.
     *
     * No, I'm not crazy and is not that I don't use `process.env`. The reason I enabled
     * this rule is because I think environment variables should be consumed on a single
     * place, instead of reading them all over the project.
     *
     * Instead of having the rule disable for all files, I prefer writing the "disable
     * comment" on a single file.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-process-env.md
     */
    'n/no-process-env': 'error',
    /**
     * I don't like this rule, and it requires config to work properly in monorepos.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unpublished-require.md
     */
    'n/no-unpublished-require': 'off',
    /**
     * I don't like this rule, and it requires config to work properly in monorepos.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unpublished-import.md
     */
    'n/no-unpublished-import': 'off',
    /**
     * This is because is not unusual **for me** to write `.sh` utils with the Node
     * hashbang that are not related to a package.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/hashbang.md
     */
    'n/hashbang': 'off',
  },
};
