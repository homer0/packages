export const node = {
  /**
   * Disallow the assignment to `exports`
   *
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-exports-assign.md
   */
  'node/no-exports-assign': 'error',
  /**
   * Require `require()` calls to be placed at top-level module scope.
   *
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/global-require.md
   */
  'node/global-require': 'error',
  /**
   * Require error handling in callbacks.
   *
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/handle-callback-err.md
   */
  'node/handle-callback-err': ['error', '^(err|error|\\w+Error)$'],
  /**
   * Disallow `require` calls to be mixed with regular variable declarations.
   *
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-mixed-requires.md
   */
  'node/no-mixed-requires': 'error',
  /**
   * Disallow `new` operators with calls to `require`
   *
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-new-require.md
   */
  'node/no-new-require': 'error',
  /**
   * Disallow string concatenation with `__dirname` and `__filename`
   *
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-path-concat.md
   */
  'node/no-path-concat': 'error',
  /**
   * Disallow the use of `process.env`
   *
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-process-env.md
   */
  'node/no-process-env': 'error',
} as const;
