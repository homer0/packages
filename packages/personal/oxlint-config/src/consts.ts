export const CONFIG_ENVS = ['browser', 'node'] as const;
export type ConfigEnv = (typeof CONFIG_ENVS)[number];

export const DEFAULT_IGNORES = ['coverage/', 'coverage-*/', 'dist/', 'node_modules/'];

export const TEST_FILES = {
  colocated: ['**/*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}'],
  directory: ['tests/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}'],
} as const;

export const EXTENSION_FRAGMENT_NAMES = [
  'base',
  'browser',
  'jsdoc',
  'node',
  'react',
  'tests',
  'typescript',
] as const;

export type TestConvention = keyof typeof TEST_FILES;

export type ExtensionFragmentName = (typeof EXTENSION_FRAGMENT_NAMES)[number];
