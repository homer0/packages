import type { LinterConfigWithExtends } from '../../commons/index.js';
import {
  createDynamicConfig,
  type CreateDynamicConfigSharedOptions,
} from '../../utils/index.js';
import basePlugin from '../../index.js';
import plugin from '../index.js';

export type CreateReactConfigOptions = CreateDynamicConfigSharedOptions & {
  baseConfig?: 'node' | 'browser';
  esm?: boolean;
  jsdoc?: boolean;
  prettier?: boolean;
  tests?: boolean;
  ts?: boolean;
};

export const createReactConfig = ({
  baseConfig = 'node',
  esm = true,
  jsdoc = false,
  prettier = true,
  tests = false,
  ts = true,
  ...options
}: CreateReactConfigOptions): LinterConfigWithExtends => {
  const availableConfigs = {
    ...basePlugin.configs,
    ...plugin.configs,
  };

  const selectedConfigs: (keyof typeof availableConfigs)[] = [];

  if (baseConfig === 'browser') {
    selectedConfigs.push(prettier ? 'browser-with-prettier' : 'browser');
    if (tests) {
      selectedConfigs.push('tests');
    }
    if (ts) {
      selectedConfigs.push('ts');
    }
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
