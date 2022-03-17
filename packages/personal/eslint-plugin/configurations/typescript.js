const extensions = ['.js', '.jsx', '.json', '.node', '.ts', '.tsx', '.d.ts'];

module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    require.resolve('../rules/typescript.js'),
  ],
  ignorePatterns: ['.eslintrc.js'],
  settings: {
    node: {
      tryExtensions: extensions,
    },
    'import/extensions': extensions,
    'import/resolver': {
      node: {
        extensions,
      },
    },
  },
};
