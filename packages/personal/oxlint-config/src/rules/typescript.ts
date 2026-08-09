export const typescript = {
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
   * Disallow `Array` constructors in favor of array literals.
   *
   * @see https://typescript-eslint.io/rules/no-array-constructor
   */
  'typescript/no-array-constructor': 'error',
  /**
   * Disallow duplicate values in TypeScript enums.
   *
   * @see https://typescript-eslint.io/rules/no-duplicate-enum-values
   */
  'typescript/no-duplicate-enum-values': 'error',
  /**
   * Disallow the empty object type.
   *
   * @see https://typescript-eslint.io/rules/no-empty-object-type
   */
  'typescript/no-empty-object-type': 'error',
  /**
   * Disallow the `any` type.
   *
   * @see https://typescript-eslint.io/rules/no-explicit-any
   */
  'typescript/no-explicit-any': 'error',
  /**
   * Disallow unnecessary non-null assertions.
   *
   * @see https://typescript-eslint.io/rules/no-extra-non-null-assertion
   */
  'typescript/no-extra-non-null-assertion': 'error',
  /**
   * Disallow classes that are used as namespaces.
   *
   * @see https://typescript-eslint.io/rules/no-misused-new
   */
  'typescript/no-misused-new': 'error',
  /**
   * Disallow TypeScript namespaces.
   *
   * @see https://typescript-eslint.io/rules/no-namespace
   */
  'typescript/no-namespace': 'error',
  /**
   * Disallow non-null assertions after optional chains.
   *
   * @see https://typescript-eslint.io/rules/no-non-null-asserted-optional-chain
   */
  'typescript/no-non-null-asserted-optional-chain': 'error',
  /**
   * Disallow CommonJS `require()` imports.
   *
   * @see https://typescript-eslint.io/rules/no-require-imports
   */
  'typescript/no-require-imports': 'error',
  /**
   * Disallow assigning `this` to another variable.
   *
   * @see https://typescript-eslint.io/rules/no-this-alias
   */
  'typescript/no-this-alias': 'error',
  /**
   * Disallow unnecessary type constraints.
   *
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-constraint
   */
  'typescript/no-unnecessary-type-constraint': 'error',
  /**
   * Disallow unsafe declaration merging.
   *
   * @see https://typescript-eslint.io/rules/no-unsafe-declaration-merging
   */
  'typescript/no-unsafe-declaration-merging': 'error',
  /**
   * Disallow unsafe built-in function types.
   *
   * @see https://typescript-eslint.io/rules/no-unsafe-function-type
   */
  'typescript/no-unsafe-function-type': 'error',
  /**
   * Disallow unused expressions.
   *
   * @see https://typescript-eslint.io/rules/no-unused-expressions
   */
  'typescript/no-unused-expressions': 'error',
  /**
   * Disallow unused variables.
   *
   * @see https://typescript-eslint.io/rules/no-unused-vars
   */
  'typescript/no-unused-vars': 'error',
  /**
   * Disallow object-wrapper types.
   *
   * @see https://typescript-eslint.io/rules/no-wrapper-object-types
   */
  'typescript/no-wrapper-object-types': 'error',
  /**
   * Require `as const` assertions for literal types.
   *
   * @see https://typescript-eslint.io/rules/prefer-as-const
   */
  'typescript/prefer-as-const': 'error',
  /**
   * Require `namespace` instead of `module` declarations.
   *
   * @see https://typescript-eslint.io/rules/prefer-namespace-keyword
   */
  'typescript/prefer-namespace-keyword': 'error',
  /**
   * Disallow triple-slash reference directives.
   *
   * @see https://typescript-eslint.io/rules/triple-slash-reference
   */
  'typescript/triple-slash-reference': 'error',
  /**
   * Enforce dot notation whenever possible.
   *
   * @see https://typescript-eslint.io/rules/dot-notation
   */
  'typescript/dot-notation': 'error',
  /**
   * Let the TypeScript-specific rule enforce array constructor usage.
   *
   * @see https://eslint.org/docs/latest/rules/no-array-constructor
   */
  'no-array-constructor': 'off',
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
   * Let the TypeScript-specific rule detect unused expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-unused-expressions
   */
  'no-unused-expressions': 'off',
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
   * Ensure consistent use of file extension within the import path.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/extensions.md
   */
  'import/extensions': 'off',
} as const;
