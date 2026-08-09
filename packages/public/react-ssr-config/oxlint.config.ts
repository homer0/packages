import { createReactConfig } from '@homer0/oxlint-config';

export default createReactConfig({
  configs: ['browser'],
  // Tests cover frontend and server behavior, but the parent browser environment is sufficient.
  tests: 'directory',
});
