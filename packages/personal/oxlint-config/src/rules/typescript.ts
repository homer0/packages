export const typescript = {
  /**
   * Enforce dot notation whenever possible.
   *
   * @see https://typescript-eslint.io/rules/dot-notation
   */
  'typescript/dot-notation': 'error',
  /**
   * Disallow unused variables.
   *
   * @see https://typescript-eslint.io/rules/no-unused-vars
   */
  'typescript/no-unused-vars': 'error',
  /**
   * Allow empty functions for interface implementations and placeholders.
   *
   * @see https://eslint.org/docs/latest/rules/no-empty-function
   */
  'no-empty-function': 'off',
  /**
   * Let the TypeScript-specific rule enforce dot notation.
   *
   * @see https://eslint.org/docs/latest/rules/dot-notation
   */
  'dot-notation': 'off',
  /**
   * Let the TypeScript-specific rule detect unused variables.
   *
   * @see https://eslint.org/docs/latest/rules/no-unused-vars
   */
  'no-unused-vars': 'off',
  /**
   * Allow constructors that TypeScript requires for parameter properties.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-constructor
   */
  'no-useless-constructor': 'off',
  /**
   * Disallow `@ts-<directive>` comments or require descriptions after directives.
   *
   * @see https://typescript-eslint.io/rules/ban-ts-comment
   */
  'typescript/ban-ts-comment': [
    'error',
    {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': 'allow-with-description',
      'ts-nocheck': 'allow-with-description',
      'ts-check': 'allow-with-description',
    },
  ],
  /**
   * Ensure consistent use of file extension within the import path.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/extensions.md
   */
  'import/extensions': 'off',
} as const;
