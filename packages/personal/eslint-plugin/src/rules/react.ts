import type { Linter } from 'eslint';

export const reactRulesConfig: Linter.Config = {
  name: '@homer0: react',
  rules: {
    /**
     * When writing components' files, I tend to write utilities, like styled components
     * or helpers, below the main component.
     *
     * @see https://eslint.org/docs/latest/rules/no-use-before-define
     */
    'no-use-before-define': 'off',
  },
};
