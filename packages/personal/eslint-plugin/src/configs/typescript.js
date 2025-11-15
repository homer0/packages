import tseslint from 'typescript-eslint';
import typescript from '../rules/typescript.js';

const extensions = ['.js', '.jsx', '.json', '.node', '.ts', '.tsx', '.d.ts'];

export default [
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
  tseslint.configs.recommended,
  typescript,
  {
    settings: {
      n: {
        tryExtensions: extensions,
      },
      'import-x/extensions': extensions,
      'import-x/resolver': {
        node: {
          extensions,
        },
      },
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.js', '.ts', '.tsx', '.d.ts', '.cts', '.mts'],
      },
    },
    rules: {},
  },
];
