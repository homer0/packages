import { createConfig } from './createConfig.js';
import type { CreateReactConfigOptions } from './types.js';

export { createConfig } from './createConfig.js';
export { extensionFragments } from './fragments.js';
export type {
  ConfigFragment,
  ConfigName,
  CreateConfigOptions,
  CreateReactConfigOptions,
  ExtensionFragmentName,
  ExtensionFragments,
  GeneratedConfig,
  GeneratedConfigOverride,
  RuleSettings,
  TestConfigOptions,
  TestsOption,
} from './types.js';

/** Creates a native Oxlint configuration with React and JSX accessibility policy. */
export const createReactConfig = (options: CreateReactConfigOptions) =>
  createConfig({
    ...options,
    react: true,
  });
