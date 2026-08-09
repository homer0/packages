import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { mkdtempSync, mkdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  createConfig,
  createNextjsConfig,
  createReactConfig,
  extensionFragments,
  type GeneratedConfig,
} from '@src/index.js';

const require = createRequire(import.meta.url);
const OXLINT_PATH = join(dirname(require.resolve('oxlint/package.json')), 'bin/oxlint');

type RunOxlintOptions = {
  config: GeneratedConfig;
  file: string;
  source: string;
  printConfig?: boolean;
};

type OxlintResult = {
  output: string;
  status: number | null;
};

const runOxlint = ({
  config,
  file,
  printConfig = false,
  source,
}: RunOxlintOptions): OxlintResult => {
  const directory = mkdtempSync(join(tmpdir(), 'oxlint-config-'));
  const filePath = resolve(directory, file);
  const fileDirectory = dirname(filePath);
  const configPath = join(directory, '.oxlintrc.json');

  mkdirSync(fileDirectory, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config));
  writeFileSync(filePath, source);

  try {
    const result = spawnSync(
      OXLINT_PATH,
      printConfig
        ? ['--config', configPath, '--print-config', filePath]
        : ['--config', configPath, filePath],
      { encoding: 'utf8' },
    );

    return {
      output: `${result.stdout}${result.stderr}`,
      status: result.status,
    };
  } finally {
    unlinkSync(configPath);
    unlinkSync(filePath);
    if (fileDirectory !== directory) rmdirSync(fileDirectory);
    rmdirSync(directory);
  }
};

describe('generated Oxlint configurations', () => {
  it('should validate a Node TypeScript configuration with directory tests', () => {
    const result = runOxlint({
      config: createConfig({
        configs: ['node'],
        tests: 'directory',
        ts: true,
      }),
      file: 'tests/example.test.ts',
      printConfig: true,
      source: 'export const value = true;\n',
    });

    expect(result).toMatchObject({ status: 0 });
  });

  it('should validate optional type-aware configuration when tsgolint is available', () => {
    const result = runOxlint({
      config: createConfig({
        configs: ['node'],
        ts: true,
        typeAware: true,
      }),
      file: 'source.ts',
      printConfig: true,
      source: 'export const value = true;\n',
    });

    expect(result).toMatchObject({ status: 0 });
  });

  it('should validate opt-in JSDoc policy', () => {
    const result = runOxlint({
      config: createConfig({
        configs: ['node'],
        jsdoc: true,
      }),
      file: 'source.ts',
      printConfig: true,
      source: 'export const value = true;\n',
    });

    expect(result).toMatchObject({ status: 0 });
  });

  it('should apply native Next.js Core Web Vitals rules', () => {
    const result = runOxlint({
      config: createNextjsConfig({}),
      file: 'page.tsx',
      source: 'export default () => <img alt="image" />;\n',
    });

    expect(result).toMatchObject({ status: 1 });
    expect(result.output).toContain('next(no-img-element)');
  });

  it('should apply production rules without applying test relaxations', () => {
    const config = createConfig({
      configs: ['node'],
      tests: true,
      ts: true,
    });
    const source = 'export class First {}\nexport class Second {}\n';

    const productionResult = runOxlint({
      config,
      file: 'source.ts',
      source,
    });
    const testResult = runOxlint({
      config,
      file: 'example.test.ts',
      source,
    });

    expect(productionResult).toMatchObject({ status: 1 });
    expect(productionResult.output).toContain('max-classes-per-file');
    expect(testResult).toMatchObject({ status: 0 });
  });

  it('should use browser globals in production and Node globals in custom tests', () => {
    const config = createConfig({
      configs: ['browser'],
      tests: {
        configs: ['node'],
        files: 'tests/**/*.ts',
        ts: true,
      },
      ts: true,
    });
    const source = "export const value = Buffer.from('value');\n";

    const productionResult = runOxlint({
      config,
      file: 'source.ts',
      source,
    });
    const testResult = runOxlint({
      config,
      file: 'tests/example.ts',
      source,
    });

    expect(productionResult).toMatchObject({ status: 1 });
    expect(productionResult.output).toContain('no-undef');
    expect(testResult).toMatchObject({ status: 0 });
  });

  it('should apply React accessibility rules to TSX files', () => {
    const result = runOxlint({
      config: createReactConfig({
        configs: ['browser'],
        ts: true,
      }),
      file: 'component.tsx',
      source: 'export const image = <img />;\n',
    });

    expect(result).toMatchObject({ status: 1 });
    expect(result.output).toContain('jsx-a11y(alt-text)');
  });

  it('should ignore matching files', () => {
    const result = runOxlint({
      config: createConfig({
        configs: ['node'],
        ignores: ['ignored.ts'],
      }),
      file: 'ignored.ts',
      source: 'export class First {}\nexport class Second {}\n',
    });

    expect(result).toMatchObject({ status: 1 });
    expect(result.output).toContain('No files found to lint');
    expect(result.output).not.toContain('max-classes-per-file');
  });

  it('should retain documented formatter and omission policy', () => {
    const config = createConfig({ configs: ['node'] });

    expect(config.rules).toMatchObject({
      curly: 'off',
      'import/no-cycle': ['error', { maxDepth: 4294967295 }],
      'no-unexpected-multiline': 'off',
    });
    expect(config.rules).not.toHaveProperty('sort-imports');
    expect(extensionFragments).toHaveProperty('jsdoc');
    expect(extensionFragments).toHaveProperty('typescript');
  });

  it('should retain TypeScript and React rule overrides', () => {
    const typescriptConfig = createConfig({
      configs: ['node'],
      ts: true,
    });
    const reactConfig = createReactConfig({
      configs: ['browser'],
      ts: true,
    });

    expect(typescriptConfig.rules).toMatchObject({
      'dot-notation': 'off',
      'no-empty-function': 'off',
      'no-unused-vars': 'off',
      'no-useless-constructor': 'off',
    });
    expect(reactConfig.rules).toMatchObject({
      'no-use-before-define': 'off',
    });
  });
});
