module.exports = {
  root: true,
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@homer0'],
  extends: ['plugin:@homer0/node-typescript-with-prettier'],
  ignorePatterns: ['.eslintrc.js', 'dist/'],
  rules: {
    'node/no-extraneous-import': [
      'error',
      {
        allowModules: ['@homer0/object-utils'],
      },
    ],
  },
};