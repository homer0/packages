import {
  addFunctionTo,
  assert,
  checkDefined,
  isFunction,
  isPlainObject,
} from '@src/original/helpers.js';
import { describe, expect, it } from 'vitest';

describe('original helpers', () => {
  describe('assert', () => {
    it('throws its message when the condition is false', () => {
      expect(() => assert(false, 'failure')).toThrow('failure');
      expect(() => assert(true, 'failure')).not.toThrow();
    });
  });

  describe('isFunction', () => {
    it('distinguishes functions from non-functions', () => {
      expect(isFunction(() => undefined)).toBe(true);
      expect(isFunction({})).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    it('accepts standard and prototype-less objects', () => {
      expect(isPlainObject({ value: 'value' })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it('rejects arrays and custom instances', () => {
      class Value {}

      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Value())).toBe(false);
    });
  });

  describe('checkDefined', () => {
    it('throws when the container does not have the key', () => {
      expect(() => checkDefined({ has: () => false }, 'missing')).toThrow(
        'Identifier "missing" is not defined.',
      );
      expect(() => checkDefined({ has: () => true }, 'present')).not.toThrow();
    });
  });

  describe('addFunctionTo', () => {
    it('adds and returns valid functions', () => {
      const functions = new Set<() => string>();
      const fn = () => 'value';

      expect(addFunctionTo(functions, fn)).toBe(fn);
      expect(functions).toEqual(new Set([fn]));
    });

    it('rejects non-function definitions', () => {
      expect(() => addFunctionTo(new Set(), {} as never)).toThrow(
        'Service definition is not a Closure or invokable object',
      );
    });
  });
});
