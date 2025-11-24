import reactHooksPlugin from 'eslint-plugin-react-hooks';
import type { Config } from 'eslint/config';
import type { LinterPlugin } from '../../commons/index.js';

export const reactHooksPluginConfig: Config = {
  plugins: {
    'react-hooks': reactHooksPlugin as LinterPlugin,
  },
  rules: {},
};

export const reactHooksPluginRecommendedConfig: Config = {
  name: 'react-hooks/recommended',
  rules: reactHooksPlugin.configs.flat.recommended.rules,
};
