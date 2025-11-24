import type { Config } from 'eslint/config';

export const reactStyleRulesConfig: Config = {
  name: '@homer0/react: base',
  rules: {
    /**
     * When writing components' files, I tend to write utilities, like styled components
     * or helpers, below the main component.
     *
     * @see https://eslint.org/docs/latest/rules/no-use-before-define
     */
    'no-use-before-define': 'off',
    /**
     * This rule is not necessary when using React 17+ with new JSX Transform.
     *
     * @see https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/react-in-jsx-scope.md
     */
    'react/react-in-jsx-scope': 'off',
  },
};
