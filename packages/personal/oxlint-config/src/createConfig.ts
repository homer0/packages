import globals from 'globals';
import {
  DEFAULT_IGNORES,
  TEST_FILES,
  CONFIG_ENVS,
  type ConfigEnv,
  type TestConvention,
} from './consts.js';
import { extensionFragments } from './fragments.js';
import {
  nextjs as nextjsRules,
  typeAware as typeAwareRules,
  vitest as vitestRules,
  noUnderscoreDangleRule,
  noUnderscoreDangleOptions,
} from './rules/index.js';
import type {
  ConfigFragment,
  ConfigOverrideOptions,
  DangleRuleOptions,
  DangleRuleSettings,
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
  RuleSettings,
} from './types.js';

const mergeRules = (...fragments: (ConfigFragment | undefined)[]) =>
  fragments.reduce<Record<string, unknown>>((acc, fragment) => {
    Object.assign(acc, fragment?.rules);
    return acc;
  }, {});

/** Combines config rules with user overrides. */
const mergeRuleSettings = (fragments: ConfigFragment[], settings: RuleSettings[] = []) =>
  mergeRules(...fragments, ...settings.map((rules) => ({ rules })));

/** Marks environment globals as unavailable. */
const disableGlobals = (env: ConfigEnv): ResolvedGlobalVars =>
  Object.fromEntries(
    Object.keys(extensionFragments[env].globals).map((name) => [name, 'off']),
  );

/** Checks if an override applies to files. */
const isConfigOverride = (
  override: ConfigOverrideOptions | RuleSettings,
): override is ConfigOverrideOptions => Object.hasOwn(override, 'files');

/** Splits rule overrides from file overrides. */
const resolveUserOverrides = (overrides: CreateConfigSettings['overrides']) => {
  if (!overrides) {
    return {
      configOverrides: [],
      ruleOverrides: [],
    };
  }

  if (!Array.isArray(overrides)) {
    return {
      configOverrides: [],
      ruleOverrides: [overrides],
    };
  }

  return overrides.reduce<{
    configOverrides: ConfigOverrideOptions[];
    ruleOverrides: RuleSettings[];
  }>(
    (acc, override) => {
      if (isConfigOverride(override)) {
        acc.configOverrides.push(override);
      } else {
        acc.ruleOverrides.push(override);
      }

      return acc;
    },
    { configOverrides: [], ruleOverrides: [] },
  );
};

const allowDangleNames = (rules: RuleSettings, names: string[] = []): RuleSettings => {
  if (names.length === 0) return rules;

  const dangleRule = rules['no-underscore-dangle'] || noUnderscoreDangleRule;
  if (!Array.isArray(dangleRule)) return rules;

  const [severity, configuredOptions] = dangleRule as DangleRuleSettings;
  const options: DangleRuleOptions =
    typeof configuredOptions === 'object' && configuredOptions !== null
      ? configuredOptions
      : {};

  return {
    ...rules,
    'no-underscore-dangle': [
      severity,
      {
        ...noUnderscoreDangleOptions,
        ...options,
        allow: Array.from(
          new Set([
            ...noUnderscoreDangleOptions.allow,
            ...(options.allow || []),
            ...names,
          ]),
        ),
      },
    ],
  };
};

const resolveGlobals = ({
  globals: globalVars = {},
  doingTestsSetup,
}: ResolveGlobalsOptions): ResolvedGlobalVars => {
  if (doingTestsSetup) {
    return globalVars;
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

const getEnvironment = (env: ConfigEnv): ConfigEnv => {
  if (!CONFIG_ENVS.includes(env)) {
    const humanReadableEnvs = CONFIG_ENVS.map((e) => `"${e}"`).join(' or ');
    throw new Error(`Environment must be ${humanReadableEnvs}.`);
  }

  return env;
};

/** Turns a file glob into a list. */
const resolveFiles = (files: string | string[]): string[] =>
  Array.isArray(files) ? files.slice() : [files];

const resolveTestFiles = (files: string | string[] | undefined): string[] => {
  if (typeof files === 'undefined') return [];
  if (typeof files === 'string' && Object.hasOwn(TEST_FILES, files)) {
    return TEST_FILES[files as TestConvention].slice();
  }

  return resolveFiles(files);
};

const resolveTestConfig = ({
  tests,
  productionEnv,
  productionTs,
}: ResolveTestConfigOptions): ResolvedTestConfig => {
  if (tests === true) {
    return {
      env: productionEnv,
      files: [...TEST_FILES.colocated, ...TEST_FILES.directory],
      framework: 'vitest',
      ts: productionTs,
    };
  }

  if (typeof tests === 'string') {
    return {
      env: productionEnv,
      files: TEST_FILES[tests].slice(),
      framework: 'vitest',
      ts: productionTs,
    };
  }

  return {
    env: tests.env ?? productionEnv,
    files: resolveTestFiles(tests.files),
    framework: tests.framework || 'vitest',
    ts: tests.ts ?? productionTs,
  };
};

const resolveTestConfigComponents = ({
  env,
  testConfig,
  tests,
  ts = false,
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
      productionEnv: env,
      productionTs: ts,
    }),
  };
};

const resolveConfigComponents = (
  options: ResolveConfigComponentsOptions,
): ResolveConfigComponentsResult => {
  const {
    env: environment,
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

  const env = getEnvironment(environment);

  const { doingTestsSetup, testConfig } = resolveTestConfigComponents({
    env,
    testConfig: options.testConfig,
    tests: options.tests,
    ts,
  });

  const fragments: ConfigFragment[] = [baseFragment, extensionFragments[env]];
  const resolvedGlobals = resolveGlobals({ globals: globalVars, doingTestsSetup });

  const plugins = ['import'];

  const configGlobals: Array<Record<string, boolean | string>> = [];

  if (env === 'node') {
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

  if (extensions?.[env]) {
    fragments.push(extensions[env]);
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
    env,
    fragments,
    globals: resolvedGlobals,
    plugins,
    testConfig,
    configGlobals:
      configGlobals.length > 0 ? Object.assign({}, ...configGlobals) : undefined,
  };
};

const createTestOverride = ({
  parentEnv,
  testConfig,
  allowedDangleNames,
  extensions,
  extraRules = [],
  globals: globalVars,
}: CreateTestOverrideOptions): GeneratedConfigOverride => {
  const {
    env,
    fragments,
    globals: resolvedGlobals,
    configGlobals,
  } = resolveConfigComponents({
    env: testConfig.env,
    extensions,
    globals: globalVars,
    testConfig,
    ts: testConfig.ts,
    baseFragment: extensionFragments.tests,
    baseExtensionFragment: extensions?.tests,
  });
  const rules = allowDangleNames(
    mergeRuleSettings(fragments, extraRules),
    allowedDangleNames,
  );

  if (testConfig.files.length === 0) {
    throw new Error('Custom test configuration requires at least one file glob.');
  }

  return {
    files: testConfig.files,
    globals: {
      ...disableGlobals(parentEnv),
      ...extensionFragments[env].globals,
      ...resolvedGlobals,
      ...configGlobals,
    },
    rules,
  };
};

type CreateConfigOverrideOptions = {
  override: ConfigOverrideOptions;
  options: CreateConfigSettings;
  parentEnv: ConfigEnv;
  rootRuleOverrides: RuleSettings[];
};

/** Creates a file override and its test override. */
const createConfigOverride = ({
  override,
  options,
  parentEnv,
  rootRuleOverrides,
}: CreateConfigOverrideOptions) => {
  const { files, ignores, rules: overrideRules, tests, ...overrideOptions } = override;
  const {
    env,
    fragments,
    globals: resolvedGlobals,
    plugins,
    testConfig,
  } = resolveConfigComponents({
    ...options,
    ...overrideOptions,
    env: override.env ?? parentEnv,
    tests,
  });
  const extraRules = [...rootRuleOverrides, ...(overrideRules ? [overrideRules] : [])];

  return {
    override: {
      excludeFiles: ignores,
      files: resolveFiles(files),
      globals: {
        ...disableGlobals(parentEnv),
        ...extensionFragments[env].globals,
        ...resolvedGlobals,
      },
      rules: allowDangleNames(
        mergeRuleSettings(fragments, extraRules),
        options.allowedDangleNames,
      ),
    },
    plugins,
    testOverride: testConfig
      ? createTestOverride({
          parentEnv,
          testConfig,
          allowedDangleNames: options.allowedDangleNames,
          extensions: overrideOptions.extensions ?? options.extensions,
          extraRules,
          globals: overrideOptions.globals ?? options.globals,
        })
      : undefined,
  };
};

/** Creates a native Oxlint configuration from one environment and optional policy layers. */
export const createConfig = (options: CreateConfigSettings): GeneratedConfig => {
  const {
    fragments,
    globals: resolvedGlobals,
    plugins: resolvedPlugins,
    env,
    testConfig,
  } = resolveConfigComponents(options);
  const { allowedDangleNames, extensions, ignores, typeAware } = options;
  const { configOverrides, ruleOverrides } = resolveUserOverrides(options.overrides);
  const generatedOverrides: GeneratedConfigOverride[] = [];
  const plugins = resolvedPlugins.slice();

  if (testConfig) {
    generatedOverrides.push(
      createTestOverride({
        parentEnv: env,
        testConfig,
        allowedDangleNames,
        extensions,
        extraRules: ruleOverrides,
        globals: resolvedGlobals,
      }),
    );
  }

  for (const override of configOverrides) {
    const generatedOverride = createConfigOverride({
      override,
      options,
      parentEnv: env,
      rootRuleOverrides: ruleOverrides,
    });

    generatedOverrides.push(generatedOverride.override);
    if (generatedOverride.testOverride) {
      generatedOverrides.push(generatedOverride.testOverride);
    }

    for (const plugin of generatedOverride.plugins) {
      if (!plugins.includes(plugin)) plugins.push(plugin);
    }
  }

  const rules = allowDangleNames(
    mergeRuleSettings(fragments, ruleOverrides),
    allowedDangleNames,
  );

  return {
    globals: {
      ...extensionFragments.base.globals,
      ...extensionFragments[env].globals,
      ...resolvedGlobals,
    },
    ignorePatterns: [...DEFAULT_IGNORES, ...(ignores || [])],
    options: typeAware ? { typeAware: true } : undefined,
    plugins,
    rules,
    overrides: generatedOverrides.length > 0 ? generatedOverrides : undefined,
  };
};
