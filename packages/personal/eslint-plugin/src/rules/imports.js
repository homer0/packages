import baseImports from '../airbnb/rules/imports.js';

const extraneousRuleSettings =
  baseImports.rules['import-x/no-extraneous-dependencies'][1];

const ext = '{js,cjs,mjs,ts,cts,mts}';

export default {
  ...baseImports,
  rules: {
    ...baseImports.rules,
    'import-x/no-extraneous-dependencies': [
      'error',
      {
        ...extraneousRuleSettings,
        devDependencies: [
          ...extraneousRuleSettings.devDependencies,
          `**/eslint.config.${ext}`,
          `**/vite.config.${ext}`,
          `**/vitest.config.${ext}`,
          `**/tsup.config.${ext}`,
        ],
      },
    ],
  },
};
