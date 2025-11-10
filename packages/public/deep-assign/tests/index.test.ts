jest.unmock('../src/deepAssign.js');
jest.unmock('../src/index.js');

import {
  deepAssign,
  deepAssignWithConcat,
  deepAssignWithOverwrite,
  deepAssignWithShallowMerge,
} from '../src/index.js';

describe('exports', () => {
  describe('deepAssign', () => {
    it('should have a function to call assign without an instance', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
      };
      const targetB = {
        b: 'X',
        c: 'C',
      };
      const expected = {
        ...targetA,
        ...targetB,
      };
      // When
      const result = deepAssign(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });

    it('should have a function to merge arrays without concatenation', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: ['D', 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: ['D', 'XE'],
      };
      const expected = {
        ...targetA,
        ...targetB,
        d: ['D', 'XE', 'F'],
      };
      // When
      const result = deepAssign(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });
  });

  describe('deepAssignWithConcat', () => {
    it('should have a function to merge arrays with concatenation', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: ['D', 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: ['D', 'XE'],
      };
      const expected = {
        ...targetA,
        ...targetB,
        d: [...targetA.d, ...targetB.d],
      };
      // When
      const result = deepAssignWithConcat(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });
  });

  describe('deepAssignWithOverwrite', () => {
    it('should have a function to merge with arrays overwrite', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: ['D', 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: ['D', 'XE'],
      };
      const expected = {
        ...targetA,
        ...targetB,
      };
      // When
      const result = deepAssignWithOverwrite(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });
  });

  describe('deepAssignWithShallowMerge', () => {
    it('should have a function to do a shallow merge of two arrays', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: [{ D: 'D' }, 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: [{ DX: 'DX' }, 'XE'],
      };
      const expected = {
        ...targetA,
        ...targetB,
        d: [{ DX: 'DX' }, 'XE', 'F'],
      };
      // When
      const result = deepAssignWithShallowMerge(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });
  });
});
