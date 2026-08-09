export const vitest = {
  /**
   * Disallow focused tests committed with `.only`.
   *
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-focused-tests.md
   */
  'vitest/no-focused-tests': 'error',
  /**
   * Disallow disabled tests committed with `.skip`.
   *
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-disabled-tests.md
   */
  'vitest/no-disabled-tests': 'error',
  /**
   * Require unique test titles within a suite.
   *
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-identical-title.md
   */
  'vitest/no-identical-title': 'error',
  /**
   * Disallow assertions that execute only in conditional branches.
   *
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-conditional-expect.md
   */
  'vitest/no-conditional-expect': 'error',
  /**
   * Disallow assertions outside a test or hook callback.
   *
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-standalone-expect.md
   */
  'vitest/no-standalone-expect': 'error',
  /**
   * Allow mock factories without explicit type parameters.
   *
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-mock-type-parameters.md
   */
  'vitest/require-mock-type-parameters': 'off',
  /**
   * Validate assertion matchers and their arguments.
   *
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/valid-expect.md
   */
  'vitest/valid-expect': 'error',
} as const;
