import jsdocPlugin from 'eslint-plugin-jsdoc';
import type { Linter } from 'eslint';

export const jsdocPluginConfig: Linter.Config = {
  plugins: {
    jsdoc: jsdocPlugin,
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
      preferredTypes: {
        object: 'GenericObject',
      },
    },
  },
  rules: {},
};
