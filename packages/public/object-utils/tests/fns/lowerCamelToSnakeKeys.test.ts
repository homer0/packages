jest.unmock('../../src/fns/formatKeys');
jest.unmock('../../src/fns/lowerCamelToSnakeKeys');

import { lowerCamelToSnakeKeys } from '../../src/fns/lowerCamelToSnakeKeys';

describe('lowerCamelToSnakeKeys', () => {
  it('should transform all keys to snake case', () => {
    // Given
    const firstName = 'Pilar';
    const nickName = 'Pili';
    const target = {
      firstName,
      nickName,
    };
    type ExpectedType = { first_name: string; nick_name: string };
    // When
    const result: ExpectedType = lowerCamelToSnakeKeys<ExpectedType>({
      target,
    });
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
        firstName,
        nickName,
      },
    };
    type ExpectedType = {
      name: { first_name: string; nickName: string };
    };
    // When
    const result: ExpectedType = lowerCamelToSnakeKeys<ExpectedType>({
      target,
      include: ['name.firstName'],
    });
    // Then
    expect(result).toEqual({
      name: {
        first_name: firstName,
        nickName,
      },
    });
  });

  it('should transform all keys to snake case except one', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      nameInfo: {
        firstName,
        nickName,
      },
    };
    type ExpectedType = {
      name_info: { firstName: string; nick_name: string };
    };
    // When
    const result: ExpectedType = lowerCamelToSnakeKeys<ExpectedType>({
      target,
      exclude: ['nameInfo.firstName'],
    });
    // Then
    expect(result).toEqual({
      name_info: {
        firstName,
        nick_name: nickName,
      },
    });
  });
});
