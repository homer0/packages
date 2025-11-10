jest.unmock('@src/fns/formatKeys.js');
jest.unmock('@src/fns/dashToSnakeKeys.js');

import { dashToSnakeKeys } from '@src/fns/dashToSnakeKeys.js';

describe('dashToSnakeKeys', () => {
  it('should transform all keys to snake case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      'first-name': firstName,
      'nick-name': nickName,
    };
    type ExpectedType = { first_name: string; last_name: string };
    // When
    const result: ExpectedType = dashToSnakeKeys<ExpectedType>({ target });
    // Then
    expect(result).toEqual({
      first_name: firstName,
      nick_name: nickName,
    });
  });

  it('should transform specific keys to snake case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      name: {
        'first-name': firstName,
        'nick-name': nickName,
      },
    };
    type ExpectedType = { name: { first_name: string; 'nick-name': string } };
    // When
    const result: ExpectedType = dashToSnakeKeys<ExpectedType>({
      target,
      include: ['name.first-name'],
    });
    // Then
    expect(result).toEqual({
      name: {
        first_name: firstName,
        'nick-name': nickName,
      },
    });
  });

  it('should transform all keys to snake case except one', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      'name-info': {
        'first-name': firstName,
        'nick-name': nickName,
      },
    };
    type ExpectedType = {
      name_info: {
        'first-name': string;
        nick_name: string;
      };
    };
    // When
    const result: ExpectedType = dashToSnakeKeys<ExpectedType>({
      target,
      exclude: ['name-info.first-name'],
    });
    // Then
    expect(result).toEqual({
      name_info: {
        'first-name': firstName,
        nick_name: nickName,
      },
    });
  });
});
