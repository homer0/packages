import bestPractices from '../rules/best-practices.js';
import errors from '../rules/errors.js';
import node from '../rules/node.js';
import style from '../rules/style.js';
import variables from '../rules/variables.js';
import es6 from '../rules/es6.js';
import imports from '../rules/imports.js';
import strict from '../rules/strict.js';

export const baseRulesConfigs = [
  bestPractices,
  errors,
  node,
  style,
  variables,
  es6,
  imports,
  strict,
];

export const baseLanguageOptionsConfig = {
  rules: {},
  languageOptions: {
    sourceType: 'module',
    parserOptions: {
      ecmaVersion: 2023, // Node 20
      sourceType: 'module',
    },
  },
};
