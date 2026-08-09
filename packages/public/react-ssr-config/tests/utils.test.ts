import { isServer } from '@src/utils.js';
import { describe, it, expect } from 'vitest';

describe('utils', () => {
  describe('isServer', () => {
    it('should return false when window is defined', () => {
      // Given/When
      const sut = isServer();
      // Then
      expect(sut).toBe(false);
    });
  });
});
