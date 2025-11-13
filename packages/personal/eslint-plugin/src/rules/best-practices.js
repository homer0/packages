import bestPractices from '../airbnb/rules/best-practices.js';

export default {
  ...bestPractices,
  rules: {
    ...bestPractices.rules,
    complexity: ['warn'],
    'class-methods-use-this': 'off',
    'no-magic-numbers': [
      'error',
      {
        ignore: [0, 1, -1, 60, 100, 1000],
        ignoreArrayIndexes: true,
        enforceConst: false,
        detectObjects: false,
      },
    ],
    'no-param-reassign': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-useless-call': 'error',
    'no-useless-escape': 'off',
  },
};
