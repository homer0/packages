import type { LinterConfigWithExtends } from '../commons/index.js';
import {
  createDynamicConfig,
  type CreateDynamicConfigSharedOptions,
} from '../utils/index.js';
import plugin from '../index.js';

type PluginInfo = typeof plugin;
type PluginConfigs = PluginInfo['configs'];

export type CreateConfigOptions = CreateDynamicConfigSharedOptions & {
  configs: (keyof PluginConfigs)[];
  esm?: boolean;
};

export const createConfig = ({
  configs = [],
  esm = true,
  ...options
}: CreateConfigOptions): LinterConfigWithExtends => {
  const selectedConfigs = configs.slice();
  if (esm && !selectedConfigs.includes('esm')) {
    selectedConfigs.push('esm');
  }

  return createDynamicConfig({
    name: 'dynamic-config',
    availableConfigs: plugin.configs,
    selectedConfigs,
    ...options,
  });
};
