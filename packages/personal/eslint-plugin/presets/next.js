/**
 * @typedef {Object} PresetOptions
 * @property {string} rootDir
 * The directory where the `tsconfig` is located.
 * @property {string[]} [configs=[]]
 * A list of extra configurations to extend. They'll be added at the end of the list
 * (after the one from next and the one from this plugin).
 * @property {string} [tsConfig='tsconfig.json']
 * The name of the `tsconfig`.
 * @property {string} [sourceType='module']
 * The source type for the `tsconfig`.
 * @property {string} [nextConfig='next/core-web-vitals']
 * The name of the Next.js config to extend.
 * @property {string[]} [jsFilter=['*.js']]
 * The filter for JS files, like `next.config.js` that should be linted with `espree`.
 * @property {boolean} [root=true]
 * Whether or not the config is root.
 * @property {boolean} [prettier=true]
 * Whether or not to use the prettier variant of this plugin base config.
 */

/**
 * Generates an ESLint configuration for Next.js and TypeScript.
 *
 * @param {PresetOptions} options  The options for the preset.
 * @returns {import('eslint').Linter.Config}
 */
const createPreset = ({
  rootDir,
  configs = [],
  tsConfig = 'tsconfig.json',
  sourceType = 'module',
  nextConfig = 'next/core-web-vitals',
  jsFilter = ['*.js'],
  root = true,
  prettier = true,
}) => ({
  root,
  parserOptions: {
    tsconfigRootDir: rootDir,
    project: [tsConfig],
    sourceType,
  },
  plugins: ['@homer0'],
  extends: [
    nextConfig,
    prettier ? 'plugin:@homer0/next-base-with-prettier' : 'plugin:@homer0/next-base',
    ...configs,
  ],
  ignorePatterns: ['.eslintrc.js', 'dist/', '.next'],
  overrides: [
    {
      files: jsFilter,
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 2020,
      },
      rules: {
        '@typescript-eslint/dot-notation': 'off',
      },
    },
  ],
  settings: {
    next: {
      rootDir,
    },
  },
});

module.exports = createPreset;
