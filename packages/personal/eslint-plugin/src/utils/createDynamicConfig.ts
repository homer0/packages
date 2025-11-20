import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import type { Config } from 'eslint/config';
import type { LinterPlugin, LinterConfigWithExtends } from '../commons/index.js';
import { resolveFilesList, type ResolveFilesListOptions } from './resolveFilesList.js';
import {
  configureExtraneousDependencies,
  type ConfigureExtraneousDependenciesOptions,
} from './configureExtraneousDependencies.js';

export type CreateDynamicConfigExtendsOptions =
  | Config[][]
  | {
      before?: Config[][];
      after?: Config[][];
    };

export type CreateDynamicConfigSharedOptions = {
  importUrl: string;
  files?: ResolveFilesListOptions['files'];
  ignores?: string | string[];
  sourceType?: 'module' | 'script';
  extraneousDependencies?: ConfigureExtraneousDependenciesOptions;
  extends?: CreateDynamicConfigExtendsOptions;
  plugins?: Record<string, LinterPlugin>;
  rules?: NonNullable<Config['rules']>;
  settings?: NonNullable<Config['settings']>;
  tsConfigName?: string;
  tsConfigPath?: string;
  addTsParser?: boolean;
};

export type CreateDynamicConfigOptions<Configs extends Record<string, Config[]>> = {
  name: string;
  availableConfigs: Configs;
  selectedConfigs: (keyof Configs)[];
} & CreateDynamicConfigSharedOptions;

export const createDynamicConfig = <Configs extends Record<string, Config[]>>(
  options: CreateDynamicConfigOptions<Configs>,
): LinterConfigWithExtends => {
  const {
    name,
    importUrl,
    availableConfigs,
    selectedConfigs,
    files = 'all',
    ignores = [],
    sourceType = 'module',
    extraneousDependencies,
    extends: extendsOption,
    plugins = {},
    rules = {},
    settings = {},
    tsConfigName = 'tsconfig.json',
    tsConfigPath = './',
    addTsParser = true,
  } = options;

  const configsToApply = selectedConfigs.map<Config[]>((configName) => {
    const configs = availableConfigs[configName];
    if (!configs) {
      throw new Error(`Config "${String(configName)}" is not available`);
    }

    return configs;
  });
  const filesToInclude = resolveFilesList({ files });
  const filesToIgnore = Array.isArray(ignores) ? ignores : [ignores];

  if (extraneousDependencies) {
    const extraneousConfig = configureExtraneousDependencies(extraneousDependencies);
    if (extraneousConfig) {
      configsToApply.push([extraneousConfig]);
    }
  }

  const settingsToUse: Record<string, unknown> = {
    ...settings,
  };

  let languageOptions: Config['languageOptions'];
  if (addTsParser) {
    const tsConfigFullPath = resolve(dirname(fileURLToPath(importUrl)), tsConfigPath);

    languageOptions = {
      parserOptions: {
        sourceType,
        project: [tsConfigName],
        tsconfigRootDir: tsConfigFullPath,
      },
    };

    settingsToUse['import-x/resolver-next'] = createTypeScriptImportResolver({
      project: join(tsConfigFullPath, tsConfigName),
    });
  }

  if (extendsOption) {
    if (Array.isArray(extendsOption)) {
      configsToApply.push(...extendsOption);
    } else {
      if (extendsOption.before) {
        configsToApply.unshift(...extendsOption.before);
      }
      if (extendsOption.after) {
        configsToApply.push(...extendsOption.after);
      }
    }
  }

  const rulesToUse: NonNullable<Config['rules']> = {
    ...rules,
  };

  return {
    name: `@homer0/${name}`,
    files: filesToInclude,
    ignores: filesToIgnore,
    extends: configsToApply.flat(),
    plugins,
    rules: rulesToUse,
    settings: settingsToUse,
    languageOptions,
  };
};
