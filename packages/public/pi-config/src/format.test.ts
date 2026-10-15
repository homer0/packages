import { describe, expect, it } from 'vitest';
import {
  formatValue,
  formatValuePreview,
  getQueryLabel,
  getUsedSourceCount,
} from './format.js';

describe('config format', () => {
  describe('formatValue', () => {
    it('returns strings as they are', () => {
      expect(formatValue('plain text')).toBe('plain text');
    });

    it.each([
      [true, 'true'],
      [5, '5'],
      [null, 'null'],
      [{ a: 1 }, '{\n  "a": 1\n}'],
      [['x'], '[\n  "x"\n]'],
    ])('formats %j as indented JSON', (value, expected) => {
      expect(formatValue(value)).toBe(expected);
    });
  });

  describe('formatValuePreview', () => {
    it('puts a multiline value in a single line', () => {
      expect(formatValuePreview({ a: 1 })).toBe('{   "a": 1 }');
    });

    it('keeps a value that fits the limit', () => {
      const value = 'a'.repeat(120);

      expect(formatValuePreview(value)).toBe(value);
    });

    it('cuts a value that is too long, ending it with an ellipsis', () => {
      const preview = formatValuePreview('a'.repeat(121));

      expect(preview).toBe(`${'a'.repeat(119)}…`);
      expect(preview).toHaveLength(120);
    });
  });

  describe('getQueryLabel', () => {
    it.each([
      [{ path: 'skills.commit.runChecks' }, 'skills.commit.runChecks'],
      [{ scope: 'skill' as const, name: 'commit' }, 'skill:commit'],
      [{ scope: 'pi' as const }, 'pi'],
      [{}, 'all'],
    ])('labels %j as %s', (query, label) => {
      expect(getQueryLabel(query)).toBe(label);
    });

    it('prefers the path over the scope', () => {
      expect(getQueryLabel({ path: 'pi.x', scope: 'tool', name: 'bash' })).toBe('pi.x');
    });
  });

  describe('getUsedSourceCount', () => {
    it.each([[undefined], [null], ['sources'], [{}]])(
      'returns 0 when the sources are %j',
      (sources) => {
        expect(getUsedSourceCount(sources)).toBe(0);
      },
    );

    it('counts only the sources that were used', () => {
      const sources = [
        { path: 'a', used: true },
        { path: 'b', used: false },
        { path: 'c' },
        { path: 'd', used: 'yes' },
        { path: 'e', used: true },
      ];

      expect(getUsedSourceCount(sources)).toBe(2);
    });

    it('ignores the entries that are not objects', () => {
      expect(getUsedSourceCount([null, undefined, 'used', 5, { used: true }])).toBe(1);
    });
  });
});
