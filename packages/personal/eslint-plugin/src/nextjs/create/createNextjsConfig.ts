import type { LinterConfigWithExtends } from '../../commons/index.js';
import {
  createDynamicConfig,
  type CreateDynamicConfigSharedOptions,
} from '../../utils/index.js';
import plugin from '../index.js';

export type CreateNextjsConfigOptions = Omit<
  CreateDynamicConfigSharedOptions,
  'sourceType'
> & {
  prettier?: boolean;
};

export const createNextjsConfig = ({
  prettier = true,
  ...options
}: CreateNextjsConfigOptions): LinterConfigWithExtends => {
  const availableConfigs = {
    ...plugin.configs,
  };

  const baseConfig = prettier ? 'nextjs-with-prettier' : 'nextjs';
  const selectedConfigs: (keyof typeof availableConfigs)[] = [baseConfig];

  return createDynamicConfig({
    name: 'nextjs-config',
    availableConfigs,
    selectedConfigs,
    sourceType: 'module',
    ...options,
  });
};
