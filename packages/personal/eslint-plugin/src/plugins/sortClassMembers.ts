// @ts-expect-error - no types available
import sortClassMembersPlugin from 'eslint-plugin-sort-class-members';
import type { Config } from 'eslint/config';
import type { LinterPlugin } from '../commons/index.js';

export const sortClassMembersPluginConfig: Config = {
  name: 'plugin:sort-class-members',
  plugins: {
    'sort-class-members': sortClassMembersPlugin as LinterPlugin,
  },
  rules: {},
};
