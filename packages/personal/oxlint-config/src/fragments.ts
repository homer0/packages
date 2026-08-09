import globals from 'globals';
import { base, browser, node, react, tests, typescript } from './rules/index.js';

export const configProfiles = {
  browser: {
    globals: globals.browser,
  },
  node: {
    globals: globals.node,
  },
} as const;

export const extensionFragments = {
  base: {
    globals: globals.es2023,
    rules: base,
  },
  browser: {
    rules: browser,
  },
  node: {
    rules: node,
  },
  react: {
    rules: react,
  },
  tests: {
    rules: tests,
  },
  typescript: {
    rules: typescript,
  },
} as const;
