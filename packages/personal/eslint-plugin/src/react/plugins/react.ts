import reactPlugin from 'eslint-plugin-react';
import type { Config } from 'eslint/config';

export const reactPluginConfig: Config = {
  plugins: {
    react: reactPlugin,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

export const reactPluginRecommendedConfig = reactPlugin.configs.flat[
  'recommended'
] as Config;
