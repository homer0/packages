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
      allowAfterThis: true,
      allowAfterSuper: true,
      enforceInMethodNames: false,
    }],
    'operator-linebreak': ['error', 'after'],
    /**
     * @todo Remove 'prefer-object-spread' when the project Node version is set to 10.
     */
    'prefer-object-spread': 'off',
  },
};
