import prettierPlugin from 'eslint-plugin-prettier';
import { rules as prettierConfigRules } from 'eslint-config-prettier';
import type { Config } from 'eslint/config';

export const prettierPluginConfigs: Config[] = [
  {
    name: 'plugin:prettier',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  {
    name: 'plugin:prettier/recommended',
    rules: {
      ...prettierConfigRules,
      'prettier/prettier': 'error',
    },
  },
];
