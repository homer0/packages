module.exports = {
  plugins: ['react', 'react-hooks'],
  env: {
    browser: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    require.resolve('./browser.js'),
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    require.resolve('../rules/react.js'),
  ],
  globals: {
    JSX: true,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['**/*.slice.ts', '**/*.slice.js'],
      rules: {
        'no-param-reassign': 'off',
      },
    },
  ],
};
