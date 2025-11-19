import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import type { LinterConfigWithExtends } from '../../commons/index.js';
import {
  resolvePresetFilesToInclude,
  type PresetFilesToInclude,
  configureExtraneousDependencies,
  type ConfigureExtraneousDependenciesOptions,
} from '../../utils/index.js';
import { esmConfig } from '../../configs/index.js';
import plugin from '../index.js';

export type CreateNextjsConfigOptions = {
  importUrl: string;
  files?: PresetFilesToInclude;
  ignores?: string | string[];
  tsConfigName?: string;
  tsConfigPath?: string;
  esm?: boolean;
  prettier?: boolean;
  extraneousDependencies?: ConfigureExtraneousDependenciesOptions;
};

export const createNextjsConfig = ({
  importUrl,
  files = 'all',
  ignores,
  tsConfigName = 'tsconfig.json',
  tsConfigPath = './',
  prettier = true,
  extraneousDependencies,
}: CreateNextjsConfigOptions): LinterConfigWithExtends => {
  const baseConfig = prettier
    ? plugin.configs['nextjs-with-prettier']
    : plugin.configs.nextjs;

  const configsToApply: Config[][] = [baseConfig, esmConfig];

  const filesToInclude = resolvePresetFilesToInclude({ files });
  let filesToIgnore: string[];
  if (ignores) {
    filesToIgnore = Array.isArray(ignores) ? ignores : [ignores];
  } else {
    filesToIgnore = [];
  }

  if (extraneousDependencies) {
    const extraneousConfig = configureExtraneousDependencies(extraneousDependencies);
    if (extraneousConfig) {
      configsToApply.push([extraneousConfig]);
    }
  }

  const tsConfigFullPath = resolve(dirname(fileURLToPath(importUrl)), tsConfigPath);

  return {
    files: filesToInclude,
    ignores: filesToIgnore,
    extends: configsToApply.flat(),
    rules: {},
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
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
