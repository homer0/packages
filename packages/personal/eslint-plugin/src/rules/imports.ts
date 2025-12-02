import type { Config } from 'eslint/config';
import {
  importsRulesConfig as base,
  noExtraneousDependenciesRuleSettings,
  noUnresolvedRuleSettings,
} from '../airbnb/index.js';

const extensions = '{js,jsx,cjs,mjs,ts,tsx,cts,mts}';
const extraDevDirs = ['.storybook'];
const extraDevFiles = [
  '.prettierrc',
  'eslint.config',
  'tsup.config',
  'vite.config',
  'vitest.config',
  '*.{stories,mocks,test,spec}',
];

export const noExtraneousDependenciesRuleUtils = {
  extensions,
  settings: {
    ...noExtraneousDependenciesRuleSettings,
    devDependencies: [
      ...noExtraneousDependenciesRuleSettings.devDependencies,
      ...extraDevDirs.map((dir) => `**/${dir}`),
      ...extraDevFiles.map((file) => `**/${file}.${extensions}`),
    ],
  },
};

export const noUnresolvedRuleUtils = {
  settings: {
    ...noUnresolvedRuleSettings,
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
    /**
     * Even tho I'm not changing the default settings from the base config, I prefer an
     * explicit declaration here, as this rule may be overridden by creators.
     *
     * @see https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
     */
    'import-x/no-unresolved': ['error', noUnresolvedRuleSettings],
  },
};
