export const tests = {
  /**
   * Enforce a maximum number of classes per file.
   *
   * @see https://eslint.org/docs/latest/rules/max-classes-per-file
   */
  'max-classes-per-file': 'off',
  /**
   * Disallow magic numbers.
   *
   * @see https://eslint.org/docs/latest/rules/no-magic-numbers
   */
  'no-magic-numbers': 'off',
  /**
   * Ensure all imports appear before other statements.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/first.md
   */
  'import/first': 'off',
} as const;
