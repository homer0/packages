jest.unmock('../src/index.js');

import * as index from '../src/index.js';

describe('index', () => {
  it('should export all the functions', () => {
    // Given/When/Then
    const exports = index as Record<string, unknown>;
    [
      'copy',
      'dashToLowerCamelKeys',
      'dashToSnakeKeys',
      'extract',
      'flat',
      'formatKeys',
      'get',
      'lowerCamelToDashKeys',
      'lowerCamelToSnakeKeys',
      'merge',
      'remove',
      'set',
      'snakeToDashKeys',
      'snakeToLowerCamelKeys',
      'unflat',
    ].forEach((fnName) => {
      expect(exports[fnName]).toBeDefined();
    });
  });
});
