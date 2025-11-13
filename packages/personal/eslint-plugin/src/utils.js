import { includeIgnoreFile } from '@eslint/compat';
import prettierPlugin from 'eslint-plugin-prettier';
import { rules as prettierConfigRules } from 'eslint-config-prettier';

const prettierConfig = [
  // Prettier Plugin
  {
    name: 'prettier/plugin/config',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  // Prettier Config
  {
    name: 'prettier/config',
    rules: {
      ...prettierConfigRules,
      'prettier/prettier': 'error',
    },
  },
];

export const addPrettier = (eslintConfig) => [...eslintConfig, ...prettierConfig];

const IGNORE_BY_ENV_VAR_NAME = 'ESLINT_IGNORE_PATH';

export const ignoreByEnvVar = () => {
  // eslint-disable-next-line n/no-process-env
  const varValue = process.env[IGNORE_BY_ENV_VAR_NAME];
  if (!varValue) {
    return [];
  }

  return includeIgnoreFile(varValue);
};
