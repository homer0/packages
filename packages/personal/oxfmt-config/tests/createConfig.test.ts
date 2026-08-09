import config, { createConfig } from '@src/index.js';
import { describe, expect, it } from 'vitest';

describe('createConfig', () => {
  it('should apply the shared style and feature defaults', () => {
    expect(createConfig()).toEqual({
      arrowParens: 'always',
      bracketSpacing: true,
      endOfLine: 'lf',
      ignorePatterns: ['coverage/', 'coverage-*/', 'dist/', 'node_modules/'],
      jsdoc: true,
      jsxSingleQuote: false,
      printWidth: 90,
      quoteProps: 'as-needed',
      semi: true,
      singleQuote: true,
      sortImports: {
        groups: [
          ['builtin', 'external', 'internal', 'subpath'],
          ['parent', 'sibling', 'index'],
          'style',
          'unknown',
        ],
        newlinesBetween: false,
      },
      sortPackageJson: false,
      tabWidth: 2,
      trailingComma: 'all',
      useTabs: false,
    });
  });

  it('should expose the default generated configuration and named factory', () => {
    expect(config).toEqual(createConfig());
  });

  it('should append custom ignores and apply feature overrides', () => {
    expect(
      createConfig({
        ignores: ['generated/**'],
        jsdoc: false,
        sortImports: false,
        sortPackageJson: true,
      }),
    ).toMatchObject({
      ignorePatterns: [
        'coverage/',
        'coverage-*/',
        'dist/',
        'node_modules/',
        'generated/**',
      ],
      jsdoc: false,
      sortImports: false,
      sortPackageJson: true,
    });
  });

  it('should apply generic overrides last', () => {
    expect(
      createConfig({
        overrides: {
          ignorePatterns: ['custom/**'],
          printWidth: 100,
          sortImports: false,
        },
      }),
    ).toMatchObject({
      ignorePatterns: ['custom/**'],
      printWidth: 100,
      sortImports: false,
    });
  });
});
