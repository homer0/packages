/**
 * @todo Document the intent and Oxlint status of every Node rule.
 */
export const node = {
  'node/no-exports-assign': 'error',
  'node/global-require': 'error',
  'node/handle-callback-err': ['error', '^(err|error|\\w+Error)$'],
  'node/no-mixed-requires': 'error',
  'node/no-new-require': 'error',
  'node/no-path-concat': 'error',
  'node/no-process-env': 'error',
} as const;
