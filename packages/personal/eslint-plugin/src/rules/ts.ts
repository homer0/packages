import type { Config } from 'eslint/config';

export const tsRulesConfig: Config = {
  name: '@homer0: ts',
  rules: {
    /**
     * The plugin doesn't detect TS scoping (private/protected), so it considers all of
     * them as public.
     *
     * @see https://github.com/bryanrsmith/eslint-plugin-sort-class-members/
     */
    'sort-class-members/sort-class-members': 'off',
    /**
     * The TS compiler will handle the module syntax.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/extensions.md
     */
    'import-x/extensions': 'off',
    /**
     * The TS compiler will handle the module syntax.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
     */
    'import-x/no-unresolved': 'off',
    /**
     * The TS compiler will handle the module syntax.
     *
     * @see https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-unsupported-features/es-syntax.md
     */
    'n/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    /**
     * Enforce dot notation whenever possible.
     *
     * @see https://typescript-eslint.io/rules/dot-notation
     */
    '@typescript-eslint/dot-notation': 'error',
    /**
     * Disallow unused variables.
     *
     * @see https://typescript-eslint.io/rules/no-unused-vars
     */
    '@typescript-eslint/no-unused-vars': 'error',
    /**
     * Allow empty functions, as they can be useful in certain scenarios, such as
     * interface implementations or placeholders.
     *
     * @see https://typescript-eslint.io/rules/no-empty-function
     */
    '@typescript-eslint/no-empty-function': 'off',
    /**
     * There are some cases, mostly on frontend, where you know the state is non-null, and
     * I don't want to have to use optional chaining for EVERYTHING.
     *
     * @see https://typescript-eslint.io/rules/no-non-null-assertion
     */
    '@typescript-eslint/no-non-null-assertion': 'off',
    /**
     * They can improve code readability and maintainability without introducing
     * redundancy.
     *
     * @see https://typescript-eslint.io/rules/no-inferrable-types
     */
    '@typescript-eslint/no-inferrable-types': 'off',
    /**
     * Require descriptions when using TypeScript directive comments.
     *
     * @see https://typescript-eslint.io/rules/ban-ts-comment
     */
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': 'allow-with-description',
      },
    ],
    /**
     * This is handled by the TS plugin.
     *
     * @see https://eslint.org/docs/latest/rules/no-useless-constructor
     */
    'no-useless-constructor': 'off',
    /**
     * This is handled by the TS plugin.
     *
     * @see https://eslint.org/docs/latest/rules/no-unused-vars
     */
    'no-unused-vars': 'off',
    /**
     * This is handled by the TS plugin.
     *
     * @see https://eslint.org/docs/latest/rules/no-empty-function
     */
    'no-empty-function': 'off',
    /**
     * This is handled by the TS plugin.
     *
     * @see https://eslint.org/docs/latest/rules/dot-notation
     */
    'dot-notation': 'off',
  },
};
