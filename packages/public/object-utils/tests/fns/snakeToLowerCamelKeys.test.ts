jest.unmock('@src/fns/formatKeys.js');
jest.unmock('@src/fns/snakeToLowerCamelKeys.js');

import { snakeToLowerCamelKeys } from '@src/fns/snakeToLowerCamelKeys.js';

describe('snakeToLowerCamelKeys', () => {
  it('should transform all keys to lower camel case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      first_name: firstName,
      nick_name: nickName,
    };
    type ExpectedType = { firstName: string; nickName: string };
    // When
    const result: ExpectedType = snakeToLowerCamelKeys<ExpectedType>({
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
    type ExpectedType = {
      name: { firstName: string; nick_name: string };
    };
    // When
    const result: ExpectedType = snakeToLowerCamelKeys<ExpectedType>({
      target,
      include: ['name.first_name'],
    });
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
    type ExpectedType = {
      nameInfo: { first_name: string; nickName: string };
    };
    // When
    const result: ExpectedType = snakeToLowerCamelKeys<ExpectedType>({
      target,
      exclude: ['name_info.first_name'],
    });
    // Then
    expect(result).toEqual({
      nameInfo: {
        first_name: firstName,
        nickName,
      },
    });
  });
});
