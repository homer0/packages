import type { Linter } from 'eslint';
import {
  importsRulesConfig as base,
  noExtraneousDependeciesRuleSettings,
} from '../airbnb/index.js';

const ext = '{js,cjs,mjs,ts,cts,mts}';
const extraDevFiles = ['eslint.config', 'vite.config', 'vitest.config', 'tsup.config'];

export const importsRulesConfig: Linter.Config = {
  ...base,
  name: '@homer0: imports',
  rules: {
    ...base.rules,
    'import-x/no-extraneous-dependencies': [
      'error',
      {
        ...noExtraneousDependeciesRuleSettings,
        devDependencies: [
          ...noExtraneousDependeciesRuleSettings.devDependencies,
          ...extraDevFiles.map((file) => `**/${file}.${ext}`),
        ],
      },
    ],
  },
};
