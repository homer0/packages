module.exports = {
  rules: {
    strict: 'off',
    'handle-callback-err': ['error', '^(err|error|\\w+Error)$'],
    'import/no-extraneous-dependencies': 'off',
    'no-mixed-requires': 'error',
    'no-process-env': 'error',
    'node/no-unpublished-require': 'off',
    'node/shebang': 'off',
  },
};
