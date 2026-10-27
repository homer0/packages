import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CACHE_TTL,
  secretProviderConfigSchema,
  secretsConfigSchema,
  timeUnitLikeSchema,
} from './schemas.js';

describe('schemas', () => {
  const provider = {
    type: 'infisical',
    url: 'https://infisical.example.com',
    credentials: { clientId: 'id' },
    enabled: true,
  };

  describe('timeUnitLikeSchema', () => {
    it.each([
      [1_000, 1_000],
      ['5m', 300_000],
    ])('transforms %s to %i milliseconds', (input, expected) => {
      expect(timeUnitLikeSchema.parse(input)).toBe(expected);
    });

    it.each([[0], [-5], ['']])('rejects %j', (input) => {
      expect(timeUnitLikeSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('secretProviderConfigSchema', () => {
    it('accepts a provider', () => {
      expect(secretProviderConfigSchema.parse(provider)).toEqual(provider);
    });

    it.each(['aws', '1password'])('accepts a %s provider without a url', (type) => {
      const value = { type, credentials: {}, enabled: true };

      expect(secretProviderConfigSchema.parse(value)).toEqual(value);
    });

    it.each([
      ['an unsupported type', { ...provider, type: 'vault' }],
      ['an infisical provider without a url', { ...provider, url: undefined }],
      ['a url that is not a url', { ...provider, url: 'not a url' }],
      ['no credentials', { ...provider, credentials: undefined }],
      ['no enabled flag', { ...provider, enabled: undefined }],
    ])('rejects %s', (_label, value) => {
      expect(secretProviderConfigSchema.safeParse(value).success).toBe(false);
    });
  });

  describe('secretsConfigSchema', () => {
    const config = { providers: { main: 'a', registry: { a: provider } } };

    it('caches the values for 10 seconds by default', () => {
      expect(DEFAULT_CACHE_TTL).toBe(10_000);
      expect(secretsConfigSchema.parse(config).cacheTtl).toBe(10_000);
    });

    it('accepts the cache ttl with units', () => {
      expect(secretsConfigSchema.parse({ ...config, cacheTtl: '1m' }).cacheTtl).toBe(
        60_000,
      );
    });

    it('keeps the fallback order, which is optional', () => {
      const parsed = secretsConfigSchema.parse({
        providers: { ...config.providers, fallbackOrder: ['a'] },
      });

      expect(parsed.providers.fallbackOrder).toEqual(['a']);
      expect(secretsConfigSchema.parse(config).providers.fallbackOrder).toBeUndefined();
    });

    it('requires the main provider and the registry', () => {
      expect(secretsConfigSchema.safeParse({ providers: { registry: {} } }).success).toBe(
        false,
      );
      expect(secretsConfigSchema.safeParse({ providers: { main: 'a' } }).success).toBe(
        false,
      );
    });
  });
});
