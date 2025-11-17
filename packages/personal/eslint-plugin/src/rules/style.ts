import type { Linter } from 'eslint';
import { styleRulesConfig as base } from '../airbnb/index.js';

export const styleRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: style',
  rules: {
    ...base.rules,
    /**
     * `airbnb(error)` -> `off`.
     *
     * The reason for having this rule enabled is valid, but I don't believe that's a very
     * common case.
     *
     * @see https://eslint.org/docs/latest/rules/no-plusplus
     */
    'no-plusplus': 'off',
    /**
     * The base rule disallows for `for...of`, `for...in`, `with`, and labels. I removed
     * `for...of`, as I use it often for iterations where I need to do async operations in
     * series. I prefer the simplicity of that syntax, over a reducer with a promise as an
     * accumulator.
     *
     * @see https://eslint.org/docs/latest/rules/no-restricted-syntax
     */
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    /**
     * Even with TypeScript, when writing a public package, it's a good idea to use the
     * "underscore prefix" convetion, as implementations that don't use TypeScript won't
     * have the enforcement of private/protected methods.
     *
     * @see https://eslint.org/docs/latest/rules/no-underscore-dangle
     */
    'no-underscore-dangle': [
      'error',
      {
        allow: ['__'],
        allowAfterThis: true,
        allowAfterSuper: true,
        enforceInMethodNames: false,
      },
    ],
    /**
     * I like to keep class members ordered in a specific way, as it helps me find things
     * faster.
     *
     * @see https://github.com/bryanrsmith/eslint-plugin-sort-class-members/
     */
    'sort-class-members/sort-class-members': [
      'error',
      {
        accessorPairPositioning: 'getThenSet',
        order: [
          '[static-properties]',
          '[static-methods]',
          '[properties]',
          '[conventional-private-properties]',
          'constructor',
          '[methods]',
          '[getters]',
          '[conventional-private-methods]',
        ],
        groups: {
          'conventional-private-methods': [
            {
              type: 'method',
              name: '/_.+/',
              static: false,
            },
          ],
          methods: [
            {
              type: 'method',
              static: false,
            },
          ],
          'static-methods': [
            {
              type: 'method',
              static: true,
            },
          ],
          getters: [
            {
              type: 'method',
              kind: 'get',
              static: false,
            },
          ],
        },
      },
    ],
  },
};
