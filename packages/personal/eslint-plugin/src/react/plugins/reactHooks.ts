import reactHooksPlugin from 'eslint-plugin-react-hooks';
import type { Config } from 'eslint/config';
import type { LinterPlugin } from '../../commons/index.js';

export const reactHooksPluginConfig: Config = {
  name: 'plugin:react-hooks',
  plugins: {
    'react-hooks': reactHooksPlugin as LinterPlugin,
  },
  rules: {},
};

export const reactHooksPluginRecommendedConfig: Config = {
  name: 'plugin:react-hooks/recommended',
  rules: reactHooksPlugin.configs.flat.recommended.rules,
};
