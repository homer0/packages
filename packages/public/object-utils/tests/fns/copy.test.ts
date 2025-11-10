jest.unmock('@src/fns/merge.js');
jest.unmock('@src/fns/copy.js');

import { copy } from '@src/fns/copy.js';

describe('copy', () => {
  it('should make a copy of an object', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const address: { street: string; number: string; zip: string } = {
      street: 'random street',
      number: 'random number',
      zip: 'random zip',
    };
    const original: {
      name: string;
      nickname: string;
      address: typeof address;
      random?: string;
    } = {
      name,
      nickname,
      address,
    };
    // When
    const result = copy(original);
    original.random = 'value';
    // Then
    expect(result).toEqual({ name, nickname, address });
  });
});
