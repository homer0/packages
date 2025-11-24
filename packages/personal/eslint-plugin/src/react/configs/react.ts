import type { Config } from 'eslint/config';
import {
  jsxA11yPluginConfig,
  jsxA11yPluginRecommendedConfig,
  reactHooksPluginConfig,
  reactPluginRecommendedConfig,
  reactPluginConfig,
  reactHooksPluginRecommendedConfig,
} from '../plugins/index.js';
import { reactStyleRulesConfig, reactSetupRulesConfig } from '../rules/index.js';

export const reactConfig: Config[] = [
  reactPluginConfig,
  reactHooksPluginConfig,
  jsxA11yPluginConfig,
  jsxA11yPluginRecommendedConfig,
  reactPluginRecommendedConfig,
  reactHooksPluginRecommendedConfig,
  reactSetupRulesConfig,
  reactStyleRulesConfig,
];
