import { describe, expect, it } from 'vitest';
import { createConfig, createNextjsConfig, createReactConfig } from '@src/index.js';

describe('createConfig', () => {
  it('should compose Node TypeScript policy with directory tests', () => {
    const config = createConfig({
      configs: ['node'],
      tests: 'directory',
      ts: true,
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

  it('should compose browser production with Node TypeScript tests', () => {
    const config = createConfig({
      configs: ['browser'],
      tests: {
        configs: ['node'],
        files: 'tests/**/*.ts',
        ts: true,
      },
      ts: true,
    });

    expect(config.globals).toHaveProperty('window');
    expect(config.rules).not.toHaveProperty('node/no-process-env');
    expect(config.overrides?.[0]).toMatchObject({
      files: ['tests/**/*.ts'],
      rules: expect.objectContaining({
        'node/no-process-env': 'error',
        'typescript/no-unused-vars': 'error',
      }),
    });
  });

  it('should apply extension fragments without requiring manual React rule merging', () => {
    const config = createReactConfig({
      configs: ['browser'],
      extensions: {
        react: {
          rules: {
            'react/jsx-key': 'warn',
          },
        },
      },
      tests: 'colocated',
      ts: true,
    });

    expect(config.rules).toMatchObject({
      'jsx-a11y/alt-text': 'error',
      'react/jsx-key': 'warn',
    });
    expect(config.overrides?.[0]?.rules).toMatchObject({
      'no-magic-numbers': 'off',
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
      jsdoc: true,
    });

    expect(config).toMatchObject({
      ignorePatterns: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
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
    const config = createConfig({ configs: ['node'] });

    expect(config.plugins).not.toContain('jsdoc');
    expect(config.plugins).not.toContain('nextjs');
  });

  it('should only enable type-aware linting when requested', () => {
    expect(createConfig({ configs: ['node'] }).options).toBeUndefined();
    expect(createConfig({ configs: ['node'], typeAware: true }).options).toEqual({
      typeAware: true,
    });
  });

  it('should reject invalid environment and custom test selections', () => {
    expect(() => createConfig({ configs: [] })).toThrow(/exactly one environment/i);
    expect(() => createConfig({ configs: ['node', 'browser'] })).toThrow(
      /exactly one environment/i,
    );
    expect(() =>
      createConfig({
        configs: ['node'],
        tests: { files: [] },
      }),
    ).toThrow(/requires at least one file glob/i);
  });
});
