import reactPlugin from 'eslint-plugin-react';
import type { Config } from 'eslint/config';

export const reactPluginConfig: Config = {
  name: 'plugin:react',
  plugins: {
    react: reactPlugin,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

export const reactPluginRecommendedConfig: Config = {
  name: 'plugin:react/recommended',
  languageOptions: {
    parserOptions: reactPlugin.configs.recommended.parserOptions,
  },
  rules: reactPlugin.configs.recommended.rules,
};
