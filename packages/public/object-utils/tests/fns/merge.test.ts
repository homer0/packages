jest.unmock('../../src/fns/merge');

import { merge } from '../../src/fns/merge';

describe('merge', () => {
  it('should merge two objects into a new one', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const objA: { name: string; random?: string } = { name };
    const objB: { nickname: string; random?: string } = { nickname };
    // When
    const result = merge<typeof objA & typeof objB>(objA, objB);
    objA.random = 'value';
    objB.random = 'value';
    // Then
    expect(result).toEqual({ name, nickname });
  });

  it('should merge two objects from arrays', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const itemA: { name: string } = { name };
    const arrA: Array<typeof itemA | string> = [itemA];
    const itemB: { nickname: string } = { nickname };
    const arrB: Array<typeof itemB | string> = [itemB];
    // When
    const result = merge<Array<typeof itemA & typeof itemB>>(arrA, arrB);
    arrA.push('value');
    arrB.push('value');
    // Then
    expect(result).toEqual([{ name, nickname }]);
  });
});
