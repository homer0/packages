import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  configs: ['node'],
  ignores: [
    '.github/*',
    '**/coverage/*',
    '**/coverage-e2e/*',
    '**/coverage-unit/*',
    'documentation/*',
    'docs/*',
    'esm/*',
    '_x-*/*',
    'packages/',
  ],
  jsdoc: true,
});
