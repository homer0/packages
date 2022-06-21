module.exports = {
  root: true,
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@homer0'],
  extends: [
    'plugin:@homer0/node-typescript-with-prettier',
    'plugin:@homer0/jest-with-prettier',
  ],
  ignorePatterns: ['.eslintrc.js'],
  globals: {
    fetch: true,
  },
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'node/no-extraneous-import': 'off',
  },
};
