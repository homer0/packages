import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  expandPlaceholders,
  getCachedValue,
  MAX_TIMEOUT,
  ms,
  SecretNotFoundError,
  SecretsConfigError,
  setCachedValue,
} from './utils.js';

describe('utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ms', () => {
    it('returns a number as it is', () => {
      expect(ms(1_500)).toBe(1_500);
    });

    it.each([
      ['10s', 10_000],
      ['5m', 300_000],
      ['2h', 7_200_000],
    ] as const)('converts %s to milliseconds', (value, expected) => {
      expect(ms(value)).toBe(expected);
    });
  });

  describe('expandPlaceholders', () => {
    it('replaces the placeholders with their values', () => {
      expect(expandPlaceholders('a:<one>:<two>', { one: '1', two: '2' })).toBe('a:1:2');
    });

    it('replaces a placeholder that has no value with its own name', () => {
      expect(expandPlaceholders('a:<missing>', {})).toBe('a:missing');
    });

    it('leaves what is not a single-word placeholder untouched', () => {
      expect(expandPlaceholders('<two words> and <>', { two: 'x' })).toBe(
        '<two words> and <>',
      );
    });
  });

  describe('in-process cache', () => {
    it('returns what was stored, and undefined for what was not', () => {
      setCachedValue({ key: 'cache:stored', value: 'value', ttl: 1_000 });

      expect(getCachedValue<string>('cache:stored')).toBe('value');
      expect(getCachedValue('cache:missing')).toBeUndefined();
    });

    it('removes a value after its ttl', () => {
      vi.useFakeTimers();
      setCachedValue({ key: 'cache:expires', value: 1, ttl: 1_000 });

      vi.advanceTimersByTime(999);
      expect(getCachedValue('cache:expires')).toBe(1);

      vi.advanceTimersByTime(1);
      expect(getCachedValue('cache:expires')).toBeUndefined();
    });

    it('restarts the countdown when a value is replaced', () => {
      vi.useFakeTimers();
      setCachedValue({ key: 'cache:replaced', value: 1, ttl: 1_000 });
      vi.advanceTimersByTime(600);
      setCachedValue({ key: 'cache:replaced', value: 2, ttl: 1_000 });

      vi.advanceTimersByTime(600);
      expect(getCachedValue('cache:replaced')).toBe(2);

      vi.advanceTimersByTime(400);
      expect(getCachedValue('cache:replaced')).toBeUndefined();
    });

    it('caps a ttl that is over the limit of setTimeout, instead of expiring it right away', () => {
      vi.useFakeTimers();
      setCachedValue({ key: 'cache:long', value: 1, ttl: 30 * 24 * 60 * 60 * 1_000 });

      vi.advanceTimersByTime(MAX_TIMEOUT - 1);
      expect(getCachedValue('cache:long')).toBe(1);

      vi.advanceTimersByTime(1);
      expect(getCachedValue('cache:long')).toBeUndefined();
    });
  });

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
});
