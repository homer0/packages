// @ts-expect-error - no types available
import sortClassMembersPlugin from 'eslint-plugin-sort-class-members';
import type { Linter } from 'eslint';
import type { LinterPlugin } from '../commons/index.js';

export const sortClassMembersPluginConfig: Linter.Config = {
  plugins: {
    'sort-class-members': sortClassMembersPlugin as LinterPlugin,
  },
  rules: {},
};
