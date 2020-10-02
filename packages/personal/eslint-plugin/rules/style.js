const DEFAULT_INDENTATION = 2;

module.exports = {
  rules: {
    'array-bracket-newline': ['error', 'consistent'],
    indent: ['error', DEFAULT_INDENTATION, {
      MemberExpression: 0,
    }],
    'lines-between-class-members': 'off',
    'max-statements-per-line': ['error', { max: 1 }],
    'no-plusplus': 'off',
    'no-underscore-dangle': ['error', {
      allow: ['__'],
      allowAfterThis: true,
      allowAfterSuper: true,
      enforceInMethodNames: false,
    }],
    'operator-linebreak': ['error', 'after'],
    'sort-class-members/sort-class-members': ['error', {
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
        'async-methods': [{
          type: 'method',
          async: true,
          static: false,
          sort: 'alphabetical',
        }],
        'conventional-async-private-methods': [{
          type: 'method',
          name: '/_.+/',
          async: true,
          static: false,
          sort: 'alphabetical',
        }],
        'conventional-private-methods': [{
          type: 'method',
          name: '/_.+/',
          async: false,
          static: false,
          sort: 'alphabetical',
        }],
        methods: [{
          type: 'method',
          async: false,
          static: false,
          sort: 'alphabetical',
        }],
        'static-async-methods': [{
          type: 'method',
          async: true,
          static: true,
          sort: 'alphabetical',
        }],
        'static-methods': [{
          type: 'method',
          async: false,
          static: true,
          sort: 'alphabetical',
        }],
        getters: [{
          type: 'method',
          kind: 'get',
          async: false,
          static: false,
          sort: 'alphabetical',
        }],
      },
    }],
  },
};
