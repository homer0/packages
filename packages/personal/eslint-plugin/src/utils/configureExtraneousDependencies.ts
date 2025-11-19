import type { Config } from 'eslint/config';
import { noExtraneousDependenciesRuleUtils } from '../rules/index.js';

type ExtraneousDependenciesSettings = {
  devDependencies: string[];
  optionalDependencies?: boolean;
  peerDependencies?: boolean;
  bundledDependencies?: boolean;
  includeInternal?: boolean;
  includeTypes?: boolean;
  packageDir?: string;
  whitelist?: string[];
};

export type ConfigureExtraneousDependenciesOptions = {
  devFiles?: string[];
  bundledDependencies?: string[];
};

export const configureExtraneousDependencies = ({
  devFiles = [],
  bundledDependencies = [],
}: ConfigureExtraneousDependenciesOptions = {}): Config | undefined => {
  if (devFiles.length === 0 && bundledDependencies.length === 0) {
    return undefined;
  }

  const settings: ExtraneousDependenciesSettings = {
    ...noExtraneousDependenciesRuleUtils.settings,
  };

  if (devFiles.length > 0) {
    settings.devDependencies = [...settings.devDependencies, ...devFiles];
  }

  if (bundledDependencies.length > 0) {
    settings.whitelist = [...(settings.whitelist ?? []), ...bundledDependencies];
  }

  return {
    name: '@homer0: extraneous dependencies config',
    rules: {
      'import-x/no-extraneous-dependencies': ['error', settings],
    },
  };
};
