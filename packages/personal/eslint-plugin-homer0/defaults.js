module.exports = {
  env: {
    node: false,
    browser: false,
  },
  extends: [
    'airbnb-base',
    './rules/best-practices.js',
    './rules/es6.js',
    './rules/style.js',
  ],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
};
