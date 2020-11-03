module.exports = {
  env: {
    node: false,
    browser: false,
  },
  extends: [
    'airbnb-base',
    ...['../rules/best-practices.js', '../rules/style.js'].map(require.resolve),
  ],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: ['sort-class-members'],
};
