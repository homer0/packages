import nodePlugin from 'eslint-plugin-n';
import type { Config } from 'eslint/config';

export const nPluginConfig: Config = {
  plugins: {
    n: nodePlugin,
  },
  rules: {},
};
