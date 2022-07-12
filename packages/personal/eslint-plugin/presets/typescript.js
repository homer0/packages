/**
 * @typedef {Object} PresetOptions
 * @property {string}   rootDir                     The directory where the `tsconfig` is
 *                                                  located.
 * @property {string[]} configs                     The list of configurations, from the
 *                                                  plugin, to extend.
 * @property {string}   [tsConfig='tsconfig.json']  The name of the `tsconfig`.
 * @property {string}   [sourceType='module']       The source type for the `tsconfig`.
 * @property {boolean}  [root=true]                 Whether or not the config is root.
 */

/**
 * Generates an ESLint configuration for TypeScript.
 *
 * @param {PresetOptions} options  The options for the preset.
 * @returns {Object}
 */
const createPreset = ({
  rootDir,
  configs,
  tsConfig = 'tsconfig.json',
  sourceType = 'module',
  root = true,
}) => ({
  root,
  parserOptions: {
    tsconfigRootDir: rootDir,
    project: tsConfig,
    sourceType,
  },
  plugins: ['@homer0'],
  extends: configs.map((config) => `plugin:@homer0/${config}`),
  ignorePatterns: ['.eslintrc.js', 'dist/'],
});

module.exports = createPreset;
