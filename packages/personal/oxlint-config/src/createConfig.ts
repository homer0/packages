import globals from 'globals';
import { TEST_FILES } from './consts.js';
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
  CreateTestOverrideOptions,
} from './types.js';

const mergeRules = (...fragments: (ConfigFragment | undefined)[]) =>
  fragments.reduce<Record<string, unknown>>((acc, fragment) => {
    Object.assign(acc, fragment?.rules);
    return acc;
  }, {});

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
      ts: productionTs,
    };
  }

  if (typeof tests === 'string') {
    return {
      configs: [productionConfig],
      files: TEST_FILES[tests].slice(),
      ts: productionTs,
    };
  }

  return {
    configs: tests.configs ?? [productionConfig],
    files: typeof tests.files === 'string' ? [tests.files] : (tests.files?.slice() ?? []),
    framework: tests.framework,
    ts: tests.ts ?? productionTs,
  };
};

const resolveTestConfigComponents = ({
  config,
  testConfig,
  tests,
  ts,
}: ResolveTestConfigComponentsOptions) => {
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
    jsdoc,
    nextjs,
    react,
    ts,
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
    plugins,
    testConfig,
    configGlobals:
      configGlobals.length > 0 ? Object.assign({}, ...configGlobals) : undefined,
  };
};

const createTestOverride = ({
  testConfig,
  extensions,
}: CreateTestOverrideOptions): GeneratedConfigOverride => {
  const { config, fragments, configGlobals } = resolveConfigComponents({
    configs: testConfig.configs,
    extensions,
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
      ...configGlobals,
    },
    rules,
  };
};

/** Creates a native Oxlint configuration from one environment and optional policy layers. */
export const createConfig = (options: CreateConfigSettings): GeneratedConfig => {
  const { fragments, plugins, config, testConfig } = resolveConfigComponents(options);
  const { extensions, ignores, typeAware } = options;

  const rules = mergeRules(...fragments);

  return {
    globals: {
      ...extensionFragments.base.globals,
      ...extensionFragments[config].globals,
    },
    ignorePatterns: ignores,
    options: typeAware ? { typeAware: true } : undefined,
    plugins,
    rules,
    overrides: testConfig ? [createTestOverride({ testConfig, extensions })] : undefined,
  };
};
