import nodePlugin from 'eslint-plugin-n';
import type { Config } from 'eslint/config';

export const nPluginConfig: Config = {
  name: 'plugin:n',
  plugins: {
    n: nodePlugin,
  },
  rules: {},
};
