import tseslint from 'typescript-eslint';
import type { Linter } from 'eslint';
import { tsRulesConfig } from '../rules/index.js';

const tsExtensions = ['.ts', '.tsx', '.d.ts', '.cts', '.mts'];
const allExtensions = ['.js', '.jsx', '.json', '.node', ...tsExtensions];

export const tsConfig: Linter.Config[] = [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {},
  },
  tseslint.configs.recommended as Linter.Config,
  tsRulesConfig,
  {
    settings: {
      n: {
        tryExtensions: allExtensions,
      },
      'import-x/extensions': allExtensions,
      'import-x/resolver': {
        node: {
          extensions: allExtensions,
        },
      },
      'import-x/parsers': {
        '@typescript-eslint/parser': tsExtensions,
      },
    },
    rules: {},
  },
];
