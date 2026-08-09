import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  configs: ['node'],
  ignores: ['eslint.config.js', 'local-config/**'],
});
