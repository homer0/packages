import { createConfig, createNextjsConfig } from '@src/index.js';
import { describe, expect, it } from 'vitest';

describe('createConfig', () => {
  it('should compose Node TypeScript policy with directory tests', () => {
    const config = createConfig({
      configs: ['node'],
      tests: 'directory',
    });

    expect(config.rules).toMatchObject({
      'node/no-process-env': 'error',
      'typescript/no-unused-vars': 'error',
    });
    expect(config.overrides).toEqual([
      expect.objectContaining({
        files: ['tests/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}'],
        rules: expect.objectContaining({
          'no-magic-numbers': 'off',
          'typescript/no-unused-vars': 'error',
          'vitest/require-mock-type-parameters': 'off',
        }),
      }),
    ]);
  });

  it('should select both test conventions when tests is true', () => {
    const config = createConfig({
      configs: ['node'],
      tests: true,
    });

    expect(config.overrides?.[0]?.files).toEqual([
      '**/*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}',
      'tests/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}',
    ]);
  });

  it('should compose Vitest rules for custom test files', () => {
    const config = createConfig({
      configs: ['node'],
      tests: {
        files: 'tests/**/*.ts',
      },
    });

    expect(config.plugins).toContain('vitest');
    expect(config.overrides?.[0]).toMatchObject({
      globals: expect.objectContaining({
        vi: false,
      }),
      rules: expect.objectContaining({
        'vitest/no-focused-tests': 'error',
        'vitest/valid-expect': 'error',
      }),
    });
  });

  it('should add configured globals to production and test overrides', () => {
    const config = createConfig({
      configs: ['node'],
      globals: {
        $browser: true,
        __piMcpState: 'readonly',
        writableGlobal: true,
      },
      tests: 'directory',
    });

    expect(config.globals).toMatchObject({
      __piMcpState: 'readonly',
      window: false,
      writableGlobal: 'writable',
    });
    expect(config.overrides?.[0]?.globals).toMatchObject({
      __piMcpState: 'readonly',
      window: false,
      writableGlobal: 'writable',
    });
  });

  it('should allow configured dangling-underscore names in production and test rules', () => {
    const config = createConfig({
      allowedDangleNames: ['__piMcpState', '__piMcpState'],
      configs: ['node'],
      tests: 'directory',
    });

    expect(config.rules['no-underscore-dangle']).toEqual([
      'error',
      {
        allow: ['__', '__piMcpState'],
        allowAfterThis: true,
        allowAfterSuper: true,
        enforceInMethodNames: false,
      },
    ]);
    expect(config.overrides?.[0]?.rules['no-underscore-dangle']).toEqual(
      config.rules['no-underscore-dangle'],
    );
  });

  it('should preserve a non-array dangling-underscore rule override', () => {
    const config = createConfig({
      allowedDangleNames: ['__piMcpState'],
      configs: ['node'],
      extensions: {
        base: {
          rules: {
            'no-underscore-dangle': 'off',
          },
        },
      },
    });

    expect(config.rules['no-underscore-dangle']).toBe('off');
  });

  it('should retain base dangling-underscore options when an override omits them', () => {
    const config = createConfig({
      allowedDangleNames: ['__piMcpState'],
      configs: ['node'],
      extensions: {
        base: {
          rules: {
            'no-underscore-dangle': ['warn'],
          },
        },
      },
    });

    expect(config.rules['no-underscore-dangle']).toEqual([
      'warn',
      {
        allow: ['__', '__piMcpState'],
        allowAfterThis: true,
        allowAfterSuper: true,
        enforceInMethodNames: false,
      },
    ]);
  });

  it('should reject unknown global groups', () => {
    expect(() =>
      createConfig({
        configs: ['node'],
        globals: { $unknown: true },
      }),
    ).toThrow(/unknown global group: "unknown"/i);
  });

  it('should compose browser production with Node TypeScript tests', () => {
    const config = createConfig({
      configs: ['browser'],
      tests: {
        configs: ['node'],
        files: 'directory',
      },
    });

    expect(config.globals).toHaveProperty('window');
    expect(config.rules).not.toHaveProperty('node/no-process-env');
    expect(config.overrides?.[0]).toMatchObject({
      files: ['tests/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}'],
      rules: expect.objectContaining({
        'node/no-process-env': 'error',
        'typescript/no-unused-vars': 'error',
      }),
    });
  });

  it('should apply extension fragments without requiring manual React rule merging', () => {
    const config = createConfig({
      configs: ['browser'],
      react: true,
      extensions: {
        react: {
          rules: {
            'react/jsx-key': 'warn',
          },
        },
      },
      tests: 'colocated',
    });

    expect(config.rules).toMatchObject({
      'jsx-a11y/alt-text': 'error',
      'react/jsx-key': 'warn',
    });
    expect(config.overrides?.[0]?.rules).toMatchObject({
      'no-magic-numbers': 'off',
    });
  });

  it('should apply base and environment extension fragments', () => {
    const config = createConfig({
      configs: ['node'],
      extensions: {
        base: {
          rules: {
            'no-console': 'warn',
          },
        },
        node: {
          rules: {
            'node/no-process-env': 'warn',
          },
        },
      },
    });

    expect(config.rules).toMatchObject({
      'no-console': 'warn',
      'node/no-process-env': 'warn',
    });
  });

  it('should compose opt-in JSDoc and TypeScript policy extensions', () => {
    const config = createConfig({
      configs: ['node'],
      extensions: {
        jsdoc: {
          rules: {
            'jsdoc/check-access': 'warn',
          },
        },
        typescript: {
          rules: {
            'typescript/no-unused-vars': 'warn',
          },
        },
      },
      jsdoc: true,
      ts: true,
    });

    expect(config.plugins).toContain('jsdoc');
    expect(config.rules).toMatchObject({
      'jsdoc/check-access': 'warn',
      'jsdoc/require-returns': 'error',
      'typescript/no-unused-vars': 'warn',
    });
  });

  it('should compose the Next.js profile', () => {
    const config = createNextjsConfig({
      globals: { customGlobal: 'readonly' },
      jsdoc: true,
    });

    expect(config).toMatchObject({
      ignorePatterns: [
        'coverage/',
        'coverage-*/',
        'dist/',
        'node_modules/',
        '.next/',
        'out/',
        'build/',
        'next-env.d.ts',
      ],
      globals: expect.objectContaining({
        customGlobal: 'readonly',
        window: false,
      }),
      plugins: expect.arrayContaining(['nextjs', 'jsdoc']),
      rules: expect.objectContaining({
        'jsdoc/check-access': 'error',
        'nextjs/no-html-link-for-pages': 'error',
        'react/jsx-key': 2,
        'typescript/no-unused-vars': 'error',
      }),
    });
  });

  it('should only enable optional plugins when their profiles are selected', () => {
    const config = createConfig({ configs: ['node'], ts: false });

    expect(config.plugins).not.toContain('jsdoc');
    expect(config.plugins).not.toContain('nextjs');
    expect(config.plugins).not.toContain('typescript');
  });

  it('should only enable type-aware linting when requested', () => {
    expect(createConfig({ configs: ['node'] }).options).toBeUndefined();

    const config = createConfig({
      configs: ['node'],
      ts: false,
      typeAware: true,
    });

    expect(config).toMatchObject({
      options: {
        typeAware: true,
      },
      rules: {
        'typescript/no-deprecated': 'error',
        'typescript/no-floating-promises': 'error',
        'typescript/no-misused-promises': 'error',
      },
    });
  });

  it('should reject invalid environment and custom test selections', () => {
    expect(() => createConfig({ configs: [] })).toThrow(/exactly one environment/i);
    expect(() =>
      createConfig({ configs: [undefined] as unknown as Array<'node' | 'browser'> }),
    ).toThrow(/exactly one environment/i);
    expect(() => createConfig({ configs: ['node', 'browser'] })).toThrow(
      /exactly one environment/i,
    );
    expect(() =>
      createConfig({
        configs: ['node'],
        tests: { files: [] },
      }),
    ).toThrow(/requires at least one file glob/i);
    expect(() =>
      createConfig({
        configs: ['node'],
        tests: { files: undefined },
      }),
    ).toThrow(/requires at least one file glob/i);
  });
});
