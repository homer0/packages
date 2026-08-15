import type {
  ConfigEnv,
  CreateConfigOptions,
  CreateNextjsConfigOptions,
  ExtensionFragments,
  GlobalVars,
  TestsOption,
} from '@src/index.js';
import { describe, expectTypeOf, it } from 'vitest';

describe('public types', () => {
  it('should support the documented configuration options', () => {
    const options = {
      allowedDangleNames: ['__piMcpState'],
      env: 'node',
      extensions: {
        typescript: {
          rules: {
            'typescript/no-explicit-any': ['deny', { fixToUnknown: true }],
          },
        },
      },
      globals: {
        $browser: true,
        __piMcpState: 'readonly',
      },
      ignores: ['dist/**'],
      jsdoc: true,
      tests: {
        env: 'node',
        files: ['tests/**/*.ts'],
        framework: 'vitest',
        ts: true,
      },
      ts: true,
      typeAware: false,
    } satisfies CreateConfigOptions;

    expectTypeOf(options).toMatchTypeOf<CreateConfigOptions>();
  });

  it('should support global groups and writable named globals', () => {
    const globals = {
      $node: true,
      customGlobal: true,
    } satisfies GlobalVars;

    // @ts-expect-error -- Global groups must be enabled with true.
    const invalidKnownGroup: GlobalVars = { $node: 'readonly' };

    expectTypeOf(globals).toMatchTypeOf<GlobalVars>();
    expectTypeOf(invalidKnownGroup).toMatchTypeOf<GlobalVars>();
  });

  it('should reject unsupported environments', () => {
    // @ts-expect-error -- Only browser and node environments are supported.
    const env: ConfigEnv = 'node-ts';

    expectTypeOf(env).toEqualTypeOf<ConfigEnv>();
  });

  it('should reject unsupported test options', () => {
    // @ts-expect-error -- Test conventions are limited to colocated and directory.
    const tests: TestsOption = 'integration';

    expectTypeOf(tests).toEqualTypeOf<TestsOption>();
  });

  it('should support the JSDoc extension fragment', () => {
    const extensions: ExtensionFragments = { jsdoc: {} };

    expectTypeOf(extensions).toMatchTypeOf<ExtensionFragments>();
  });

  it('should fix Next.js projects to Node TypeScript configuration', () => {
    const options = {
      jsdoc: true,
      tests: 'directory',
    } satisfies CreateNextjsConfigOptions;

    expectTypeOf(options).toMatchTypeOf<CreateNextjsConfigOptions>();
  });
});
