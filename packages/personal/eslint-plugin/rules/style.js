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
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForOfStatement',
        message:
          'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
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
