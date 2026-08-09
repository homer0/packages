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
  ExtensionFragments,
  GeneratedConfig,
  GeneratedConfigOverride,
  ResolvedTestConfig,
  ResolveTestConfigOptions,
  ResolveConfigComponents,
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

const resolveConfigComponents = (
  options: CreateConfigSettings,
): ResolveConfigComponents => {
  const { configs, extensions, jsdoc, nextjs, react, ts, typeAware } = options;

  const config = getConfig(options.configs);

  const fragments: ConfigFragment[] = [
    extensionFragments.base,
    extensionFragments[config],
  ];
  const plugins = ['import'];
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

  if (extensions?.base) {
    fragments.push(extensions.base);
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
  };
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

const createTestOverride = (
  testConfig: ResolvedTestConfig,
  extensions: ExtensionFragments | undefined,
): GeneratedConfigOverride => {
  const config = getConfig(testConfig.configs);
  const rules = mergeRules(
    extensionFragments.tests,
    extensionFragments[config],
    testConfig.ts ? extensionFragments.typescript : undefined,
    testConfig.framework === 'vitest' ? { rules: vitestRules } : undefined,
    extensions?.tests,
    extensions?.[config],
    testConfig.ts ? extensions?.typescript : undefined,
  );

  if (testConfig.files.length === 0) {
    throw new Error('Custom test configuration requires at least one file glob.');
  }

  return {
    files: testConfig.files,
    globals: extensionFragments[config].globals,
    rules,
  };
};

/** Creates a native Oxlint configuration from one environment and optional policy layers. */
export const createConfig = (options: CreateConfigSettings): GeneratedConfig => {
  const { fragments, plugins, config } = resolveConfigComponents(options);
  const { extensions, ignores, tests, ts, typeAware } = options;

  const rules = mergeRules(...fragments);
  const testConfig = resolveTestConfig({
    tests,
    productionConfig: config,
    productionTs: ts ?? false,
  });
  if (testConfig?.framework === 'vitest') {
    plugins.push('vitest');
  }

  return {
    globals: {
      ...extensionFragments.base.globals,
      ...extensionFragments[config].globals,
    },
    ignorePatterns: ignores,
    options: typeAware ? { typeAware: true } : undefined,
    plugins,
    rules,
    overrides: testConfig ? [createTestOverride(testConfig, extensions)] : undefined,
  };
};
