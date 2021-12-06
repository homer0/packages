const DEFAULT_INDENTATION = 2;

module.exports = {
  rules: {
    'array-bracket-newline': ['error', 'consistent'],
    indent: [
      'error',
      DEFAULT_INDENTATION,
      {
        MemberExpression: 0,
      },
    ],
    'lines-between-class-members': 'off',
    'max-statements-per-line': ['error', { max: 1 }],
    'no-plusplus': 'off',
    'no-underscore-dangle': [
      'error',
      {
        allow: ['__'],
        allowAfterThis: true,
        allowAfterSuper: true,
        enforceInMethodNames: false,
      },
    ],
    'operator-linebreak': ['error', 'after'],
    quotes: ['error', 'single', { avoidEscape: false }],
    'sort-class-members/sort-class-members': [
      'error',
      {
        accessorPairPositioning: 'getThenSet',
        order: [
          '[static-properties]',
          '[static-methods]',
          '[static-async-methods]',
          '[properties]',
          '[conventional-private-properties]',
          'constructor',
          '[methods]',
          '[async-methods]',
          '[getters]',
          '[conventional-private-methods]',
          '[conventional-async-private-methods]',
        ],
        groups: {
          'async-methods': [
            {
              type: 'method',
              async: true,
              static: false,
            },
          ],
          'conventional-async-private-methods': [
            {
              type: 'method',
              name: '/_.+/',
              async: true,
              static: false,
            },
          ],
          'conventional-private-methods': [
            {
              type: 'method',
              name: '/_.+/',
              async: false,
              static: false,
            },
          ],
          methods: [
            {
              type: 'method',
              async: false,
              static: false,
            },
          ],
          'static-async-methods': [
            {
              type: 'method',
              async: true,
              static: true,
            },
          ],
          'static-methods': [
            {
              type: 'method',
              async: false,
              static: true,
            },
          ],
          getters: [
            {
              type: 'method',
              kind: 'get',
              async: false,
              static: false,
            },
          ],
        },
      },
    ],
  },
};
