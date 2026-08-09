import { TEST_FILES } from './consts.js';
import { extensionFragments } from './fragments.js';
import type {
  ConfigFragment,
  ConfigName,
  CreateConfigSettings,
  ExtensionFragments,
  GeneratedConfig,
  GeneratedConfigOverride,
  ResolvedTestConfig,
  ResolveTestConfigOptions,
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
export const createConfig = ({
  configs,
  extensions,
  ignores,
  react = false,
  tests,
  ts = false,
  typeAware = false,
}: CreateConfigSettings): GeneratedConfig => {
  const config = getConfig(configs);
  const rules = mergeRules(
    extensionFragments.base,
    extensionFragments[config],
    ts ? extensionFragments.typescript : undefined,
    react ? extensionFragments.react : undefined,
    extensions?.base,
    extensions?.[config],
    ts ? extensions?.typescript : undefined,
    react ? extensions?.react : undefined,
  );
  const testConfig = resolveTestConfig({
    tests,
    productionConfig: config,
    productionTs: ts,
  });

  return {
    globals: {
      ...extensionFragments.base.globals,
      ...extensionFragments[config].globals,
    },
    ignorePatterns: ignores,
    options: typeAware ? { typeAware: true } : undefined,
    plugins: ['import', 'node', 'typescript', 'react', 'jsx-a11y'],
    rules,
    overrides: testConfig ? [createTestOverride(testConfig, extensions)] : undefined,
  };
};
