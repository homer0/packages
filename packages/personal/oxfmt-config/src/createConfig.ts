import type { CreateConfigOptions, GeneratedConfig } from './types.js';

const DEFAULT_IGNORES = ['coverage/', 'coverage-*/', 'dist/', 'node_modules/'];

const BASE_CONFIG = {
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  jsxSingleQuote: false,
  printWidth: 90,
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
} as const satisfies GeneratedConfig;

/** Creates an Oxfmt configuration with shared formatting policy and feature defaults. */
export const createConfig = ({
  ignores = [],
  jsdoc = true,
  overrides = {},
  sortImports = true,
  sortPackageJson = false,
}: CreateConfigOptions = {}): GeneratedConfig => ({
  ...BASE_CONFIG,
  ignorePatterns: [...DEFAULT_IGNORES, ...ignores],
  jsdoc,
  sortImports,
  sortPackageJson,
  ...overrides,
});
