/**
 * @todo Document the intent and Oxlint status of every TypeScript rule.
 */
export const typescript = {
  'typescript/dot-notation': 'error',
  'typescript/no-unused-vars': 'error',
  'typescript/ban-ts-comment': [
    'error',
    {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': 'allow-with-description',
      'ts-nocheck': 'allow-with-description',
      'ts-check': 'allow-with-description',
    },
  ],
  'import/extensions': 'off',
} as const;
