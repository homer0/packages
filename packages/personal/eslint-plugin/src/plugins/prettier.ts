import prettierPlugin from 'eslint-plugin-prettier';
import { rules as prettierConfigRules } from 'eslint-config-prettier';
import type { Config } from 'eslint/config';

export const prettierPluginConfigs: Config[] = [
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
