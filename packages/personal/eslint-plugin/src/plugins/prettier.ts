import prettierPlugin from 'eslint-plugin-prettier';
import { rules as prettierConfigRules } from 'eslint-config-prettier';
import type { Linter } from 'eslint';

export const prettierPluginConfigs: Linter.Config[] = [
  {
    name: 'prettier/plugin/config',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  {
    name: 'prettier/config',
    rules: {
      ...prettierConfigRules,
      'prettier/prettier': 'error',
    },
  },
];
