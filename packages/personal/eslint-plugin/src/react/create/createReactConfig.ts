import type { LinterConfigWithExtends } from '../../commons/index.js';
import {
  createDynamicConfig,
  type CreateDynamicConfigSharedOptions,
} from '../../utils/index.js';
import basePlugin from '../../index.js';
import plugin from '../index.js';

export type CreateReactConfigOptions = CreateDynamicConfigSharedOptions & {
  base?: 'node' | 'browser';
  tests?: boolean;
  esm?: boolean;
  prettier?: boolean;
  ts?: boolean;
  jsdoc?: boolean;
};

export const createReactConfig = ({
  base = 'node',
  esm = true,
  prettier = true,
  ts = true,
  tests = false,
  jsdoc = false,
  ...options
}: CreateReactConfigOptions): LinterConfigWithExtends => {
  const availableConfigs = {
    ...basePlugin.configs,
    ...plugin.configs,
  };

  const selectedConfigs: (keyof typeof availableConfigs)[] = [];

  if (base === 'browser') {
    selectedConfigs.push(prettier ? 'browser-with-prettier' : 'browser');
  } else if (tests) {
    selectedConfigs.push(prettier ? 'node-ts-tests-with-prettier' : 'node-ts');
  } else if (prettier) {
    selectedConfigs.push(ts ? 'node-ts-with-prettier' : 'node-with-prettier');
  } else {
    selectedConfigs.push(ts ? 'node-ts' : 'node');
  }

  selectedConfigs.push('react');

  if (jsdoc) {
    selectedConfigs.push('jsdoc');
  }

  if (esm) {
    selectedConfigs.push('esm');
  }

  return createDynamicConfig({
    name: 'react-config',
    availableConfigs,
    selectedConfigs,
    ...options,
  });
};
