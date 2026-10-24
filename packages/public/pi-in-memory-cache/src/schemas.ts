import { z } from 'zod';
import { DEFAULT_MAX_UPTIME } from './constants.js';
import { ms, type TimeStringUnitLike } from './utils.js';

/**
 * Zod schema for a time value that accepts either a millisecond number or a
 * human-readable string (e.g. `'5m'`, `'2h'`). Always transforms to milliseconds.
 */
export const timeUnitLikeSchema = z
  .union([z.number().positive(), z.string().min(1)])
  .transform((val) => ms(val as TimeStringUnitLike));

/** Zod schema for the `extensions.inMemoryCache` config block. */
export const inMemoryCacheConfigSchema = z.object({
  /** How long the daemon can run before the client restarts it. */
  maxUptime: timeUnitLikeSchema.default(DEFAULT_MAX_UPTIME),
});

/** The resolved `extensions.inMemoryCache` config. */
export type InMemoryCacheConfig = z.infer<typeof inMemoryCacheConfigSchema>;

/**
 * Minimal Zod schema for a raw daemon response. Validates the top-level `ok` discriminant
 * and captures `error` on failure. Detailed field shapes are enforced at the TypeScript
 * level via `socketOperations`.
 */
export const socketResponseSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }).loose(),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

/** Zod schema for what the daemon writes back: the response, and if it should stop. */
export const socketMessageSchema = z.object({
  response: socketResponseSchema,
  stop: z.boolean().optional(),
});

/** What the daemon writes back for a request. */
export type SocketMessage = z.infer<typeof socketMessageSchema>;

/** The request and response schemas of every operation the daemon supports. */
export const socketOperations = {
  get: {
    request: z.object({ op: z.literal('get'), key: z.string() }),
    response: z.discriminatedUnion('found', [
      z.object({ ok: z.literal(true), found: z.literal(true), value: z.unknown() }),
      z.object({ ok: z.literal(true), found: z.literal(false) }),
    ]),
  },
  set: {
    request: z.object({
      op: z.literal('set'),
      key: z.string(),
      value: z.unknown(),
      ttl: z.number().int().nonnegative(),
    }),
    response: z.object({ ok: z.literal(true) }),
  },
  delete: {
    request: z.object({ op: z.literal('delete'), key: z.string() }),
    response: z.object({ ok: z.literal(true) }),
  },
  ping: {
    request: z.object({ op: z.literal('ping') }),
    response: z.object({
      ok: z.literal(true),
      uptimeMs: z.number().int().nonnegative(),
      entries: z.number().int().nonnegative(),
    }),
  },
  status: {
    request: z.object({ op: z.literal('status') }),
    response: z.object({
      ok: z.literal(true),
      uptimeMs: z.number().int().nonnegative(),
      entries: z.number().int().nonnegative(),
      pid: z.number().int().nonnegative(),
      memoryRssBytes: z.number().int().nonnegative(),
      cpuUserMs: z.number().int().nonnegative(),
      cpuSystemMs: z.number().int().nonnegative(),
    }),
  },
  stop: {
    request: z.object({ op: z.literal('stop') }),
    response: z.object({ ok: z.literal(true) }),
  },
  flush: {
    request: z.object({ op: z.literal('flush') }),
    response: z.object({ ok: z.literal(true), cleared: z.number().int().nonnegative() }),
  },
};

/** The schemas of every operation the daemon supports. */
export type SocketOperations = typeof socketOperations;

/** The name of an operation the daemon supports. */
export type SocketMessageOp = keyof SocketOperations;

/**
 * The request of an operation.
 *
 * @template Op The name of the operation.
 */
export type SocketOperationRequest<Op extends SocketMessageOp> = z.input<
  SocketOperations[Op]['request']
>;

/**
 * The response of an operation, when it succeeds.
 *
 * @template Op The name of the operation.
 */
export type SocketOperationResponse<Op extends SocketMessageOp> = z.infer<
  SocketOperations[Op]['response']
>;

/**
 * What the daemon handler of an operation returns: the response, or an error, and if the
 * daemon should stop after replying.
 *
 * @template Op The name of the operation.
 */
export type SocketOperationResult<Op extends SocketMessageOp> = {
  response: SocketOperationResponse<Op> | { ok: false; error: string };
  stop?: boolean;
};
