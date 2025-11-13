import baseErrors from '../airbnb/rules/errors.js';

export default {
  ...baseErrors,
  rules: {
    ...baseErrors.rules,
    'no-await-in-loop': 'off',
  },
};
