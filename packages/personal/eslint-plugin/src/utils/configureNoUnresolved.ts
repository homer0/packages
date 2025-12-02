import type { Config } from 'eslint/config';
import { noUnresolvedRuleUtils } from '../rules/index.js';

type NoUnresolvedSettings = {
  commonjs?: boolean;
  caseSensitive?: boolean;
  ignore?: string[];
};

export type ConfigureNoUnresolvedOptions = {
  ignore?: string[];
};

export const configureNoUnresolved = ({
  ignore = [],
}: ConfigureNoUnresolvedOptions = {}): Config | undefined => {
  if (ignore.length === 0) {
    return undefined;
  }

  const settings: NoUnresolvedSettings = {
    ...noUnresolvedRuleUtils.settings,
    ignore,
  };

  return {
    name: '@homer0: no unresolved config',
    rules: {
      'import-x/no-unresolved': ['error', settings],
    },
  };
};
