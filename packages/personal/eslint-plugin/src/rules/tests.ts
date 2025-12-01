import type { Config } from 'eslint/config';

export const testsRulesConfig: Config = {
  name: '@homer0: tests',
  rules: {
    /**
     * This will either be handled by TypeScript or by the runtime (Jest, Vitest, etc).
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-missing-import.md
     */
    'import-x/no-unresolved': 'off',
    /**
     * In test files, it's normal to have mocks' setup at the top of the file.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/first.md
     */
    'import-x/first': 'off',
    /**
     * No need to validate dependencies on test files.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-extraneous-dependencies.md
     */
    'import-x/no-extraneous-dependencies': 'off',
    /**
     * In test files, magic numbers are totally acceptable.
     *
     * @see https://eslint.org/docs/latest/rules/no-magic-numbers
     */
    'no-magic-numbers': 'off',
    /**
     * If you are testing an abstracted class, you might need more than one class.
     *
     * @see https://eslint.org/docs/latest/rules/max-classes-per-file
     */
    'max-classes-per-file': 'off',
  },
};
