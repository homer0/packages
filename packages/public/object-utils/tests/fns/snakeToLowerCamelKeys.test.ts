jest.unmock('../../src/fns/formatKeys');
jest.unmock('../../src/fns/snakeToLowerCamelKeys');

import { snakeToLowerCamelKeys } from '../../src/fns/snakeToLowerCamelKeys';

describe('snakeToLowerCamelKeys', () => {
  it('should transform all keys to lower camel case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      first_name: firstName,
      nick_name: nickName,
    };
    // When
    const result = snakeToLowerCamelKeys<{ firstName: string; nickName: string }>({
      target,
    });
    // Then
    expect(result).toEqual({
      firstName,
      nickName,
    });
  });

  it('should transform specific keys to lower camel case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      name: {
        first_name: firstName,
        nick_name: nickName,
      },
    };
    // When
    const result = snakeToLowerCamelKeys<{
      name: { firstName: string; nick_name: string };
    }>({ target, include: ['name.first_name'] });
    // Then
    expect(result).toEqual({
      name: {
        firstName,
        nick_name: nickName,
      },
    });
  });

  it('should transform all keys to lower camel case except one', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      name_info: {
        first_name: firstName,
        nick_name: nickName,
      },
    };
    // When
    const result = snakeToLowerCamelKeys<{
      nameInfo: { first_name: string; nickName: string };
    }>({ target, exclude: ['name_info.first_name'] });
    // Then
    expect(result).toEqual({
      nameInfo: {
        first_name: firstName,
        nickName,
      },
    });
  });
});
