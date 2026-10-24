import { describe, expect, it } from 'vitest';
import { SecretNotFoundError, SecretsConfigError } from './errors.js';

describe('errors', () => {
  describe('SecretNotFoundError', () => {
    it('says which secret was not found', () => {
      const error = new SecretNotFoundError('API_TOKEN');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SecretNotFoundError');
      expect(error.message).toBe('Secret not found: API_TOKEN');
      expect(error.secretName).toBe('API_TOKEN');
    });
  });

  describe('SecretsConfigError', () => {
    it('keeps the description of what is wrong', () => {
      const error = new SecretsConfigError('Main secret provider not found: a');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SecretsConfigError');
      expect(error.message).toBe('Main secret provider not found: a');
    });
  });
});
