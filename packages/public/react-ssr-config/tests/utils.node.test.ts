import { isServer } from '@src/utils.js';
/* @vitest-environment node */
import { describe, it, expect } from 'vitest';

describe('utils (node)', () => {
  describe('isServer', () => {
    it('should return true when window is not defined', () => {
      // Given/When
      const sut = isServer();
      // Then
      expect(sut).toBe(true);
    });
  });
});
