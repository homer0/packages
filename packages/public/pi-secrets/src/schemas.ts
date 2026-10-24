import { z } from 'zod';
import { ms, type TimeStringUnitLike } from './utils.js';

/** The default time-to-live of the cached secret values, in milliseconds (10 seconds). */
export const DEFAULT_CACHE_TTL = ms('10s');

/**
 * Zod schema for a time value that accepts either a millisecond number or a
 * human-readable string (e.g. `'5m'`, `'2h'`). Always transforms to milliseconds.
 */
export const timeUnitLikeSchema = z
  .union([z.number().positive(), z.string().min(1)])
  .transform((val) => ms(val as TimeStringUnitLike));

/** Supported secret provider implementations. */
export const secretProviderTypeSchema = z.literal('infisical');

/** Runtime schema for one configured secret provider. */
export const secretProviderConfigSchema = z.object({
  /** The implementation of the provider. */
  type: secretProviderTypeSchema,
  /** The base URL of the provider. */
  url: z.url(),
  /** The credentials, which depend on the type of provider. */
  credentials: z.record(z.string(), z.unknown()),
  /** Whether the provider can be used. */
  enabled: z.boolean(),
});

/** Runtime schema for the `extensions.secrets` config. */
export const secretsConfigSchema = z.object({
  /** How long the secret values are cached for. */
  cacheTtl: timeUnitLikeSchema.default(DEFAULT_CACHE_TTL),
  providers: z.object({
    /** The name of the provider to try first. */
    main: z.string(),
    /** The providers, by name. */
    registry: z.record(z.string(), secretProviderConfigSchema),
    /** The names of the providers to try after the main one, in order. */
    fallbackOrder: z.array(z.string()).optional(),
  }),
});
