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

const resolveTestFiles = (files: string | string[] | undefined): string[] => {
  if (typeof files === 'undefined') return [];
  if (Array.isArray(files)) return files.slice();
  if (Object.hasOwn(TEST_FILES, files))
    return TEST_FILES[files as TestConvention].slice();

  return [files];
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
  testConfig,
  allowedDangleNames,
  extensions,
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
  const rules = allowDangleNames(mergeRules(...fragments), allowedDangleNames);

  if (testConfig.files.length === 0) {
    throw new Error('Custom test configuration requires at least one file glob.');
  }

  return {
    files: testConfig.files,
    globals: {
      ...extensionFragments[env].globals,
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
    env,
    testConfig,
  } = resolveConfigComponents(options);
  const { allowedDangleNames, extensions, ignores, typeAware } = options;

  const rules = allowDangleNames(mergeRules(...fragments), allowedDangleNames);

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
    overrides: testConfig
      ? [
          createTestOverride({
            testConfig,
            allowedDangleNames,
            extensions,
            globals: resolvedGlobals,
          }),
        ]
      : undefined,
  };
};
