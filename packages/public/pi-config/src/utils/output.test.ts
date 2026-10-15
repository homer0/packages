import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ensureErrorMessage } from './output.js';

describe('ensureErrorMessage', () => {
  it('returns the message of an error', () => {
    expect(ensureErrorMessage(new Error('something failed'))).toBe('something failed');
  });

  it('joins the issues of a zod error instead of surfacing its raw message', () => {
    const result = z.object({ a: z.string(), b: z.number() }).safeParse({ a: 1, b: 'x' });
    const error = result.error!;

    const message = ensureErrorMessage(error);

    expect(message).toBe(error.issues.map((issue) => issue.message).join('; '));
    expect(message).toContain('; ');
    expect(message).not.toContain('"code"');
  });

  it.each([
    ['a string', 'plain failure', 'plain failure'],
    ['a number', 404, '404'],
    ['undefined', undefined, 'undefined'],
    ['an object', { not: 'an error' }, '[object Object]'],
  ])('converts %s to a string', (_label, value, expected) => {
    expect(ensureErrorMessage(value)).toBe(expected);
  });
});
