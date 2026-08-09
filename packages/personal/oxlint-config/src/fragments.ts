import globals from 'globals';
import type { ExtensionFragmentName } from './consts.js';
import { base, browser, node, react, tests, typescript } from './rules/index.js';

/** Policy fragments used by the configuration factories and caller extensions. */
export const extensionFragments = {
  base: {
    globals: globals.es2023,
    rules: base,
  },
  browser: {
    globals: globals.browser,
    rules: browser,
  },
  node: {
    globals: globals.node,
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
} as const satisfies Record<ExtensionFragmentName, object>;
