import { describe, expect, it } from 'vitest';
import * as api from './index.js';

describe('public API', () => {
  it('exposes the functions, the errors, and the config schemas', () => {
    expect(Object.keys(api).toSorted()).toEqual([
      'SecretNotFoundError',
      'SecretsConfigError',
      'escapeReferences',
      'getSecret',
      'getSecrets',
      'resolveInterpolatedValue',
      'secretProviderConfigSchema',
      'secretProviderTypeSchema',
      'secretsConfigSchema',
    ]);
  });
});
