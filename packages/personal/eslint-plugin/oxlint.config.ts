import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  env: 'node',
  ignores: ['eslint.config.js', 'local-config/**'],
});
