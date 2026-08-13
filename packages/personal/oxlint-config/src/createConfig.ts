import globals from 'globals';
import { DEFAULT_IGNORES, TEST_FILES, type TestConvention } from './consts.js';
import { extensionFragments } from './fragments.js';
import {
  nextjs as nextjsRules,
  typeAware as typeAwareRules,
  vitest as vitestRules,
} from './rules/index.js';
import type {
  ConfigFragment,
  ConfigName,
  CreateConfigSettings,
  GeneratedConfig,
  GeneratedConfigOverride,
  ResolvedTestConfig,
  ResolveTestConfigOptions,
  ResolveConfigComponentsOptions,
  ResolveConfigComponentsResult,
  ResolveTestConfigComponentsOptions,
  ResolveTestConfigComponentsResult,
  CreateTestOverrideOptions,
  ResolveGlobalsOptions,
  ResolvedGlobalVars,
} from './types.js';

const mergeRules = (...fragments: (ConfigFragment | undefined)[]) =>
  fragments.reduce<Record<string, unknown>>((acc, fragment) => {
    Object.assign(acc, fragment?.rules);
    return acc;
  }, {});

const resolveGlobals = ({
  globals: globalVars,
  doingTestsSetup,
}: ResolveGlobalsOptions): ResolvedGlobalVars => {
  if (doingTestsSetup) {
    return globalVars || {};
  }

  if (!globalVars) {
    return {};
  }

  return Object.entries(globalVars).reduce<ResolvedGlobalVars>((acc, [name, mode]) => {
    if (name.startsWith('$')) {
      const groupName = name.slice(1);
      if (!Object.hasOwn(globals, groupName)) {
        throw new Error(`Unknown global group: "${groupName}".`);
      }

      Object.assign(acc, globals[groupName as keyof typeof globals]);
    } else {
      acc[name] = mode === true ? 'writable' : mode;
    }

    return acc;
  }, {});
};

const getConfig = (configs: ConfigName[]): ConfigName => {
  if (configs.length !== 1) {
    throw new Error(
      'Exactly one environment config must be selected: "node" or "browser".',
    );
  }

  const [config] = configs;
  if (typeof config === 'undefined') {
    throw new Error(
      'Exactly one environment config must be selected: "node" or "browser".',
    );
  }

  return config;
};

const resolveTestFiles = (files: string | string[] | undefined): string[] => {
  if (typeof files === 'undefined') return [];
  if (Array.isArray(files)) return files.slice();
  if (Object.hasOwn(TEST_FILES, files))
    return TEST_FILES[files as TestConvention].slice();

  return [files];
};

const resolveTestConfig = ({
  tests,
  productionConfig,
  productionTs,
}: ResolveTestConfigOptions): ResolvedTestConfig | undefined => {
  if (!tests) return undefined;

  if (tests === true) {
    return {
      configs: [productionConfig],
      files: [...TEST_FILES.colocated, ...TEST_FILES.directory],
      framework: 'vitest',
      ts: productionTs,
    };
  }

  if (typeof tests === 'string') {
    return {
      configs: [productionConfig],
      files: TEST_FILES[tests].slice(),
      framework: 'vitest',
      ts: productionTs,
    };
  }

  return {
    configs: tests.configs ?? [productionConfig],
    files: resolveTestFiles(tests.files),
    framework: tests.framework || 'vitest',
    ts: tests.ts ?? productionTs,
  };
};

const resolveTestConfigComponents = ({
  config,
  testConfig,
  tests,
  ts,
}: ResolveTestConfigComponentsOptions): ResolveTestConfigComponentsResult => {
  if (testConfig) {
    return {
      doingTestsSetup: true,
      testConfig,
    };
  }

  if (!tests) {
    return {
      doingTestsSetup: false,
      testConfig: undefined,
    };
  }

  return {
    doingTestsSetup: false,
    testConfig: resolveTestConfig({
      tests,
      productionConfig: config,
      productionTs: ts ?? false,
    }),
  };
};

const resolveConfigComponents = (
  options: ResolveConfigComponentsOptions,
): ResolveConfigComponentsResult => {
  const {
    configs,
    extensions,
    globals: globalVars,
    jsdoc,
    nextjs,
    react,
    ts = true,
    typeAware,
    baseFragment = extensionFragments.base,
    baseExtensionFragment: baseExtensionFragmentOption,
  } = options;

  const baseExtensionFragment = baseExtensionFragmentOption ?? extensions?.base;

  const config = getConfig(options.configs);

  const { doingTestsSetup, testConfig } = resolveTestConfigComponents({
    config,
    testConfig: options.testConfig,
    tests: options.tests,
    ts,
  });

  const fragments: ConfigFragment[] = [baseFragment, extensionFragments[config]];
  const resolvedGlobals = resolveGlobals({ globals: globalVars, doingTestsSetup });

  const plugins = ['import'];

  const configGlobals: Array<Record<string, boolean | string>> = [];

  if (configs.includes('node')) {
    plugins.push('node');
  }

  if (jsdoc) {
    fragments.push(extensionFragments.jsdoc);
    plugins.push('jsdoc');
  }

  if (ts) {
    fragments.push(extensionFragments.typescript);
  }

  if (typeAware) {
    fragments.push({ rules: typeAwareRules });
  }

  if (ts || typeAware) {
    plugins.push('typescript');
  }

  if (react) {
    fragments.push(extensionFragments.react);
    plugins.push('react', 'jsx-a11y', 'react-perf');
  }

  if (nextjs) {
    fragments.push({ rules: nextjsRules });
    plugins.push('nextjs');
  }

  if (testConfig?.framework === 'vitest') {
    plugins.push('vitest');
    if (doingTestsSetup) {
      fragments.push({ rules: vitestRules });
      configGlobals.push(globals.vitest);
    }
  }

  if (baseExtensionFragment) {
    fragments.push(baseExtensionFragment);
  }

  if (extensions?.[config]) {
    fragments.push(extensions[config]);
  }

  if (jsdoc && extensions?.jsdoc) {
    fragments.push(extensions.jsdoc);
  }

  if (ts && extensions?.typescript) {
    fragments.push(extensions.typescript);
  }

  if (react && extensions?.react) {
    fragments.push(extensions.react);
  }

  return {
    config,
    fragments,
    globals: resolvedGlobals,
    plugins,
    testConfig,
    configGlobals:
      configGlobals.length > 0 ? Object.assign({}, ...configGlobals) : undefined,
  };
};

const createTestOverride = ({
  testConfig,
  extensions,
  globals: globalVars,
}: CreateTestOverrideOptions): GeneratedConfigOverride => {
  const {
    config,
    fragments,
    globals: resolvedGlobals,
    configGlobals,
  } = resolveConfigComponents({
    configs: testConfig.configs,
    extensions,
    globals: globalVars,
    testConfig,
    ts: testConfig.ts,
    baseFragment: extensionFragments.tests,
    baseExtensionFragment: extensions?.tests,
  });
  const rules = mergeRules(...fragments);

  if (testConfig.files.length === 0) {
    throw new Error('Custom test configuration requires at least one file glob.');
  }

  return {
    files: testConfig.files,
    globals: {
      ...extensionFragments[config].globals,
      ...resolvedGlobals,
      ...configGlobals,
    },
    rules,
  };
};

/** Creates a native Oxlint configuration from one environment and optional policy layers. */
export const createConfig = (options: CreateConfigSettings): GeneratedConfig => {
  const {
    fragments,
    globals: resolvedGlobals,
    plugins,
    config,
    testConfig,
  } = resolveConfigComponents(options);
  const { extensions, ignores, typeAware } = options;

  const rules = mergeRules(...fragments);

  return {
    globals: {
      ...extensionFragments.base.globals,
      ...extensionFragments[config].globals,
      ...resolvedGlobals,
    },
    ignorePatterns: [...DEFAULT_IGNORES, ...(ignores || [])],
    options: typeAware ? { typeAware: true } : undefined,
    plugins,
    rules,
    overrides: testConfig
      ? [
          createTestOverride({
            testConfig,
            extensions,
            globals: resolvedGlobals,
          }),
        ]
      : undefined,
  };
};
