import baseNode from '../airbnb/rules/node.js';

export default {
  ...baseNode,
  rules: {
    ...baseNode.rules,
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    'node/no-unpublished-import': 'off',
    'node/no-missing-import': 'off',
  },
};
