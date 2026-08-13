import { createConfig } from './createConfig.js';
import type { CreateReactConfigOptions } from './types.js';

export { createConfig } from './createConfig.js';
export { createNextjsConfig } from './createNextjsConfig.js';
export { extensionFragments } from './fragments.js';
export type {
  ConfigFragment,
  ConfigName,
  CreateConfigOptions,
  CreateNextjsConfigOptions,
  CreateReactConfigOptions,
  ExtensionFragments,
  GlobalVarMode,
  GlobalVars,
  GeneratedConfig,
  GeneratedConfigOverride,
  RuleSettings,
  TestConfigOptions,
  TestFramework,
  TestsOption,
} from './types.js';
export type { ExtensionFragmentName } from './consts.js';

/** Creates a native Oxlint configuration with React and JSX accessibility policy. */
export const createReactConfig = (options: CreateReactConfigOptions) =>
  createConfig({
    ...options,
    react: true,
  });
