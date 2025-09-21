/* @jest-environment node */
jest.unmock('../src/utils');

import { isServer } from '../src/utils';

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
