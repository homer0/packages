import sortClassMembersPlugin from 'eslint-plugin-sort-class-members';
import type { Linter } from 'eslint';

export const sortClassMembersPluginConfig: Linter.Config = {
  plugins: {
    'sort-class-members': sortClassMembersPlugin,
  },
  rules: {},
};
