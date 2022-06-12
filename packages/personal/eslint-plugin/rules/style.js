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
