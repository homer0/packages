jest.unmock('../../src/fns/formatKeys');
jest.unmock('../../src/fns/dashToSnakeKeys');

import { dashToSnakeKeys } from '../../src/fns/dashToSnakeKeys';

describe('dashToSnakeKeys', () => {
  it('should transform all keys to snake case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      'first-name': firstName,
      'nick-name': nickName,
    };
    // When
    const result = dashToSnakeKeys<{ first_name: string; last_name: string }>({ target });
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
    // When
    const result = dashToSnakeKeys<{ name: { first_name: string; 'nick-name': string } }>(
      { target, include: ['name.first-name'] },
    );
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
    // When
    const result = dashToSnakeKeys<{
      name_info: {
        'first-name': string;
        nick_name: string;
      };
    }>({ target, exclude: ['name-info.first-name'] });
    // Then
    expect(result).toEqual({
      name_info: {
        'first-name': firstName,
        nick_name: nickName,
      },
    });
  });
});
