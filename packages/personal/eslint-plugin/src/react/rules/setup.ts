import type { Config } from 'eslint/config';

export const reactSetupRulesConfig: Config = {
  name: '@homer0/react: setup',
  rules: {
    /**
     * This rule is not necessary when using React 17+ with new JSX Transform.
     *
     * @see https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/react-in-jsx-scope.md
     */
    'react/react-in-jsx-scope': 'off',
  },
};
