module.exports = {
  rules: {
    'import/no-unresolved': 'off',
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    'node/no-unpublished-import': 'off',
  },
};
