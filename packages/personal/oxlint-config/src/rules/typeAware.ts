export const typeAware = {
  /**
   * Disallow use of APIs marked as deprecated by TypeScript declarations.
   *
   * @see https://typescript-eslint.io/rules/no-deprecated
   */
  'typescript/no-deprecated': 'error',
  /**
   * Require promises to be awaited, returned, or explicitly ignored.
   *
   * @see https://typescript-eslint.io/rules/no-floating-promises
   */
  'typescript/no-floating-promises': 'error',
  /**
   * Disallow promises in places that expect synchronous values or callbacks.
   *
   * @see https://typescript-eslint.io/rules/no-misused-promises
   */
  'typescript/no-misused-promises': 'error',
} as const;
