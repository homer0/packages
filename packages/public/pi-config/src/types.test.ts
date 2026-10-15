import { describe, expect, it } from 'vitest';
import { ConfigReadError, ConfigValidationError } from './types.js';

describe('config errors', () => {
  describe('ConfigReadError', () => {
    it('keeps the message, the file path and the cause', () => {
      const cause = new Error('original');

      const error = new ConfigReadError('could not read', '/x/config.json', { cause });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConfigReadError');
      expect(error.message).toBe('could not read');
      expect(error.filePath).toBe('/x/config.json');
      expect(error.cause).toBe(cause);
    });

    it('does not need a cause', () => {
      const error = new ConfigReadError('could not read', '/x/config.json');

      expect(error.cause).toBeUndefined();
    });
  });

  describe('ConfigValidationError', () => {
    it('keeps the message and the validation issues', () => {
      const issues = [{ code: 'custom', message: 'bad', path: ['pi'] }] as never;

      const error = new ConfigValidationError('does not match', issues);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConfigValidationError');
      expect(error.message).toBe('does not match');
      expect(error.issues).toBe(issues);
    });
  });
});
