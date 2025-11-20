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
import {
  loadIgnoreFile,
  type LoadIgnoreFileOptions,
  type IgnoreFileSearchLimit,
} from './loadIgnoreFile.js';

export type CreateDynamicConfigExtendsOptions =
  | Config[][]
  | {
      before?: Config[][];
      after?: Config[][];
    };

export type CreateDynamicConfigLoadIgnoreFileOptions =
  | boolean
  | IgnoreFileSearchLimit
  | Omit<LoadIgnoreFileOptions, 'rootDir'>;

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
  loadIgnoreFile?: CreateDynamicConfigLoadIgnoreFileOptions;
};

export type CreateDynamicConfigOptions<Configs extends Record<string, Config[]>> = {
  name: string;
  availableConfigs: Configs;
  selectedConfigs: (keyof Configs)[];
} & CreateDynamicConfigSharedOptions;

const addExtendsConfigs = (
  configsToApply: Config[][],
  extendsOption?: CreateDynamicConfigExtendsOptions,
): void => {
  if (!extendsOption) {
    return;
  }

  if (Array.isArray(extendsOption)) {
    configsToApply.push(...extendsOption);
    return;
  }

  if (extendsOption.before) {
    configsToApply.unshift(...extendsOption.before);
  }

  if (extendsOption.after) {
    configsToApply.push(...extendsOption.after);
  }
};

const addExtraneousDependenciesConfig = (
  configsToApply: Config[][],
  extraneousDependencies?: ConfigureExtraneousDependenciesOptions,
): void => {
  if (!extraneousDependencies) {
    return;
  }

  const extraneousConfig = configureExtraneousDependencies(extraneousDependencies);
  if (!extraneousConfig) {
    return;
  }

  configsToApply.push([extraneousConfig]);
};

const addIgnoreFileConfig = (
  configsToApply: Config[][],
  rootDir: string,
  loadIgnoreFileOption?: CreateDynamicConfigLoadIgnoreFileOptions,
): void => {
  if (!loadIgnoreFileOption) {
    return;
  }

  let useLoadIgnoreFileOptions: LoadIgnoreFileOptions;
  if (loadIgnoreFileOption === true) {
    useLoadIgnoreFileOptions = {
      rootDir,
      limit: '.gitignore',
      includeGitignore: true,
    };
  } else if (typeof loadIgnoreFileOption === 'object') {
    useLoadIgnoreFileOptions = {
      rootDir,
      ...loadIgnoreFileOption,
    };
  } else {
    useLoadIgnoreFileOptions = {
      rootDir,
      limit: loadIgnoreFileOption,
      includeGitignore: true,
    };
  }

  const ignoreFileConfigs = loadIgnoreFile(useLoadIgnoreFileOptions);
  configsToApply.push(ignoreFileConfigs);
};

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
    loadIgnoreFile: loadIgnoreFileOption,
  } = options;

  const configsToApply = selectedConfigs.map<Config[]>((configName) => {
    const configs = availableConfigs[configName];
    if (!configs) {
      throw new Error(`Config "${String(configName)}" is not available`);
    }

    return configs;
  });

  const rootDir = resolve(dirname(fileURLToPath(importUrl)), '.');

  const filesToInclude = resolveFilesList({ files });
  const filesToIgnore = Array.isArray(ignores) ? ignores : [ignores];

  addExtraneousDependenciesConfig(configsToApply, extraneousDependencies);
  addExtendsConfigs(configsToApply, extendsOption);
  addIgnoreFileConfig(configsToApply, rootDir, loadIgnoreFileOption);

  const settingsToUse: Record<string, unknown> = {
    ...settings,
  };

  let languageOptions: Config['languageOptions'];
  if (addTsParser) {
    const tsConfigFullPath = resolve(rootDir, tsConfigPath);

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
