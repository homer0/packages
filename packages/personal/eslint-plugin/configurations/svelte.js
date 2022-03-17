module.exports = {
  plugins: ['svelte3'],
  env: {
    browser: true,
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  settings: {
    // eslint-disable-next-line jsdoc/require-jsdoc
    'svelte3/ignore-styles': () => true,
  },
  extends: ['./browser.js', '../rules/svelte.js'].map(require.resolve),
};
