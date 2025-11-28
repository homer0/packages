import jsdocPlugin from 'eslint-plugin-jsdoc';
import type { Config } from 'eslint/config';

export const jsdocPluginConfig: Config = {
  name: 'plugin:jsdoc',
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
