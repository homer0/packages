import type { Config } from 'eslint/config';
import {
  importsRulesConfig as base,
  noExtraneousDependenciesRuleSettings,
} from '../airbnb/index.js';

const extensions = '{js,cjs,mjs,ts,cts,mts}';
const extraDevFiles = ['eslint.config', 'vite.config', 'vitest.config', 'tsup.config'];

export const noExtraneousDependenciesRuleUtils = {
  extensions,
  settings: {
    ...noExtraneousDependenciesRuleSettings,
    devDependencies: [
      ...noExtraneousDependenciesRuleSettings.devDependencies,
      ...extraDevFiles.map((file) => `**/${file}.${extensions}`),
    ],
  },
};

export const importsRulesConfig: Config = {
  ...base,
  name: '@homer0: imports',
  rules: {
    ...base.rules,
    /**
     * In my projects, I prefer named exports by default.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/prefer-default-export.md
     */
    'import-x/prefer-default-export': 'off',
    /**
     * Added a few extra dev files to the list of devDependencies allowed files.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-extraneous-dependencies.md
     */
    'import-x/no-extraneous-dependencies': [
      'error',
      noExtraneousDependenciesRuleUtils.settings,
    ],
  },
};
