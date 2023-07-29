module.exports = {
  env: {
    browser: true,
  },
  extends: [
    require.resolve('./browser.js'),
    'plugin:svelte/recommended',
    require.resolve('../rules/svelte.js'),
  ],
};
