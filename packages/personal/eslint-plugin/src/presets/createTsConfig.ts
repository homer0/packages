import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Linter } from 'eslint';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import type { LinterConfigWithExtends } from '../commons/index.js';
import {
  resolvePresetFilesToInclude,
  type PresetFilesToInclude,
} from '../utils/index.js';
import plugin from '../index.js';

type PluginInfo = typeof plugin;
type PluginConfigs = PluginInfo['configs'];

export type CreateTsConfigOptions = {
  importUrl: string;
  configs: (keyof PluginConfigs)[];
  files?: PresetFilesToInclude;
  ignores?: string | string[];
  tsConfigName?: string;
  tsConfigPath?: string;
  esm?: boolean;
  sourceType?: 'module' | 'script';
};

export const createTsConfig = ({
  importUrl,
  files = 'all',
  ignores,
  tsConfigName = 'tsconfig.json',
  tsConfigPath = './',
  configs = [],
  esm = true,
  sourceType = 'module',
}: CreateTsConfigOptions): LinterConfigWithExtends => {
  const configsToApply = configs.map<Linter.Config[]>(
    (configName) => plugin.configs[configName],
  );
  const filesToInclude = resolvePresetFilesToInclude({ files });
  let filesToIgnore: string[];
  if (ignores) {
    filesToIgnore = Array.isArray(ignores) ? ignores : [ignores];
  } else {
    filesToIgnore = [];
  }

  if (esm && !configs.includes('esm')) {
    configsToApply.push(plugin.configs.esm);
  }

  const tsConfigFullPath = resolve(dirname(fileURLToPath(importUrl)), tsConfigPath);

  return {
    files: filesToInclude,
    ignores: filesToIgnore,
    extends: configsToApply.flat(),
    rules: {},
    languageOptions: {
      parserOptions: {
        sourceType,
        project: [tsConfigName],
        tsconfigRootDir: tsConfigFullPath,
      },
    },
    settings: {
      'import-x/resolver-next': createTypeScriptImportResolver({
        project: join(tsConfigFullPath, tsConfigName),
      }),
    },
  };
};
