import type { Linter } from 'eslint';
import { bestPracticesRulesConfig as base } from '../airbnb/index.js';

export const bestPracticesRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: best-practices',
  rules: {
    ...base.rules,
    /**
     * `airbnb(off)` -> `warn`.
     *
     * I want the linter to warn me if I'm writing a big function/method.
     *
     * @see https://eslint.org/docs/latest/rules/complexity
     */
    complexity: ['warn'],
    /**
     * `airbnb(error)` -> `off`.
     *
     * I write almost everything using OOP, and some times I want to create a method to
     * extract some logic and I don't want to be restricted by this rule.
     *
     * @see https://eslint.org/docs/latest/rules/class-methods-use-this
     */
    'class-methods-use-this': 'off',
    /**
     * `airbnb(off)` -> `error`.
     *
     * I like self explanatory code, and magic numbers get in the way of that.
     *
     * @see https://eslint.org/docs/latest/rules/no-magic-numbers
     */
    'no-magic-numbers': [
      'error',
      {
        ignore: [
          0, // for length checks.
          1, // for offsets, and increments.
          -1, // for indexes (`at(-1)`).
          60, // for time calculations.
          100, // for percentages.
          1000, // for time calculations.
        ],
        ignoreArrayIndexes: true,
        enforceConst: false,
        detectObjects: false,
      },
    ],
    /**
     * `airbnb(off)` -> `error`.
     *
     * No idea why do they disabled this rule, it's a great help to avoid infinite loops.
     *
     * @see https://eslint.org/docs/latest/rules/no-unmodified-loop-condition
     */
    'no-unmodified-loop-condition': 'error',
    /**
     * `airbnb(off)` -> `error`.
     *
     * I haven't use `call` or `apply` for years now, as I believe that with ES6+ you can
     * cover 99% of the cases in which they were useful. This is now enabled to avoid
     * unnecessary uses of them.
     *
     * @see https://eslint.org/docs/latest/rules/no-useless-call
     */
    'no-useless-call': 'error',
    /**
     * `airbnb(error)` -> `off`.
     *
     * I use regular expressions often, and I have found more than a couple of cases in
     * which this rule was wrong.
     *
     * @see https://eslint.org/docs/latest/rules/no-useless-escape
     */
    'no-useless-escape': 'off',
  },
};
