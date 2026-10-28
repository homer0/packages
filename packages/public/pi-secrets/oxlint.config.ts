import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  env: 'node',
  tests: 'colocated',
  allowedDangleNames: ['__piSecretsOnePasswordClients', '__piSecretsCustomClasses'],
});
