// @ts-expect-error - it has DT types, but I don't want to add them as peer deps
import jsxA11yPluginRaw from 'eslint-plugin-jsx-a11y';
import type { Config } from 'eslint/config';
import type { LinterPlugin } from '../../commons/index.js';

const jsxA11yPlugin = jsxA11yPluginRaw as unknown as LinterPlugin & {
  flatConfigs: {
    recommended: Config;
  };
};

export const jsxA11yPluginConfig: Config = {
  name: 'plugin:jsx-a11y',
  plugins: {
    'jsx-a11y': jsxA11yPlugin,
  },
  rules: {},
};

export const jsxA11yPluginRecommendedConfig: Config = {
  name: 'plugin:jsx-a11y/recommended',
  languageOptions: jsxA11yPlugin.flatConfigs.recommended.languageOptions,
  rules: jsxA11yPlugin.flatConfigs.recommended.rules,
};
