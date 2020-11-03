/**
 * Extends an existing ESLint configuration by adding Prettier on the `extends`.
 *
 * @param {Object} config  The base configuration.
 * @returns {Object}
 */
const addPrettier = (config) => ({
  ...config,
  extends: [
    ...(config.extends || []),
    'prettier',
  ],
});

module.exports.addPrettier = addPrettier;
