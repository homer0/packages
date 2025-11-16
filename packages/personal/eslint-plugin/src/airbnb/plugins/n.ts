import nodePlugin from 'eslint-plugin-n';
import type { Linter } from 'eslint';

export const nPluginConfig: Linter.Config = {
  plugins: {
    n: nodePlugin,
  },
  rules: {},
};
