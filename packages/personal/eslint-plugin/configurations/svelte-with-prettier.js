module.exports = {
  env: {
    browser: true,
  },
  extends: [
    require.resolve('./browser.js'),
    'plugin:svelte/prettier',
    require.resolve('../rules/svelte.js'),
  ],
};
