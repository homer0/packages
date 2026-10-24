import { describe, expect, it } from 'vitest';
import {
  inMemoryCacheConfigSchema,
  socketMessageSchema,
  socketOperations,
  socketResponseSchema,
  timeUnitLikeSchema,
} from './schemas.js';

describe('timeUnitLikeSchema', () => {
  it.each([
    [1_000, 1_000],
    ['5m', 300_000],
    ['2h', 7_200_000],
  ])('transforms %s to %i milliseconds', (input, expected) => {
    expect(timeUnitLikeSchema.parse(input)).toBe(expected);
  });

  it.each([[0], [-5], ['']])('rejects %j', (input) => {
    expect(timeUnitLikeSchema.safeParse(input).success).toBe(false);
  });
});

describe('inMemoryCacheConfigSchema', () => {
  it('restarts the daemon after an hour by default', () => {
    expect(inMemoryCacheConfigSchema.parse({})).toEqual({ maxUptime: 3_600_000 });
  });

  it('accepts the max uptime with units', () => {
    expect(inMemoryCacheConfigSchema.parse({ maxUptime: '2h' })).toEqual({
      maxUptime: 7_200_000,
    });
  });
});

describe('socketResponseSchema', () => {
  it('keeps the extra fields of a successful response', () => {
    expect(socketResponseSchema.parse({ ok: true, found: false })).toEqual({
      ok: true,
      found: false,
    });
  });

  it('requires the error of a failed response', () => {
    expect(socketResponseSchema.parse({ ok: false, error: 'nope' })).toEqual({
      ok: false,
      error: 'nope',
    });
    expect(socketResponseSchema.safeParse({ ok: false }).success).toBe(false);
  });
});

describe('socketMessageSchema', () => {
  it('accepts a response with or without the stop flag', () => {
    expect(socketMessageSchema.safeParse({ response: { ok: true } }).success).toBe(true);
    expect(
      socketMessageSchema.safeParse({ response: { ok: true }, stop: true }).success,
    ).toBe(true);
  });
});

describe('socketOperations', () => {
  it('has a request and a response schema for each operation', () => {
    expect(Object.keys(socketOperations).toSorted()).toEqual([
      'delete',
      'flush',
      'get',
      'ping',
      'set',
      'status',
      'stop',
    ]);
  });

  it('only accepts a non-negative integer ttl in a set request', () => {
    const base = { op: 'set', key: 'k', value: 1 };

    expect(socketOperations.set.request.safeParse({ ...base, ttl: 0 }).success).toBe(
      true,
    );
    expect(socketOperations.set.request.safeParse({ ...base, ttl: -1 }).success).toBe(
      false,
    );
    expect(socketOperations.set.request.safeParse({ ...base, ttl: 1.5 }).success).toBe(
      false,
    );
  });

  it('tells a found entry from a missing one in the get response', () => {
    expect(
      socketOperations.get.response.parse({ ok: true, found: true, value: 'x' }),
    ).toEqual({ ok: true, found: true, value: 'x' });
    expect(socketOperations.get.response.parse({ ok: true, found: false })).toEqual({
      ok: true,
      found: false,
    });
  });
});
