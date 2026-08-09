import { describe, expectTypeOf, it } from 'vitest';
import type {
  ConfigName,
  CreateConfigOptions,
  ExtensionFragments,
  TestsOption,
} from '@src/index.js';

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
      tests: {
        files: ['tests/**/*.ts'],
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

  it('should reject unsupported extension fragments', () => {
    // @ts-expect-error -- JSDoc is not an initial extension fragment.
    const extensions: ExtensionFragments = { jsdoc: {} };

    expectTypeOf(extensions).toMatchTypeOf<ExtensionFragments>();
  });
});
