import globals from 'globals';
import baseNode from '../airbnb/rules/node.js';

export default {
  ...baseNode,
  languageOptions: {
    globals: {
      ...globals.es2023,
    },
  },
  rules: {
    ...baseNode.rules,
    strict: 'off',
    'n/handle-callback-err': ['error', '^(err|error|\\w+Error)$'],
    'n/no-mixed-requires': 'error',
    'n/no-process-env': 'error',
    'n/no-unpublished-require': 'off',
    'n/no-unpublished-import': 'off',
    'n/shebang': 'off',
    'import-x/no-extraneous-dependencies': 'off',
  },
};
