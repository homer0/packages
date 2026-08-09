import type {
  ConfigName,
  CreateConfigOptions,
  CreateNextjsConfigOptions,
  ExtensionFragments,
  TestsOption,
} from '@src/index.js';
import { describe, expectTypeOf, it } from 'vitest';

describe('public types', () => {
  it('should support the documented configuration options', () => {
    const options = {
      configs: ['node'],
      extensions: {
        typescript: {
          rules: {
            'typescript/no-explicit-any': ['deny', { fixToUnknown: true }],
          },
        },
      },
      ignores: ['dist/**'],
      jsdoc: true,
      tests: {
        configs: ['node'],
        files: ['tests/**/*.ts'],
        framework: 'vitest',
        ts: true,
      },
      ts: true,
      typeAware: false,
    } satisfies CreateConfigOptions;

    expectTypeOf(options).toMatchTypeOf<CreateConfigOptions>();
  });

  it('should reject unsupported configuration names', () => {
    // @ts-expect-error -- Only browser and node configuration names are supported.
    const config: ConfigName = 'node-ts';

    expectTypeOf(config).toEqualTypeOf<ConfigName>();
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
