import type { Linter } from 'eslint';
import { styleRulesConfig as base } from '../airbnb/index.js';

export const styleRulesConfig: Linter.Config = {
  ...base,
  rules: {
    ...base.rules,
    'no-plusplus': 'off',
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
    'no-underscore-dangle': [
      'error',
      {
        allow: ['__'],
        allowAfterThis: true,
        allowAfterSuper: true,
        enforceInMethodNames: false,
      },
    ],
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
