jest.unmock('../../src/fns/formatKeys.js');
jest.unmock('../../src/fns/dashToLowerCamelKeys.js');

import { dashToLowerCamelKeys } from '../../src/fns/dashToLowerCamelKeys.js';

describe('dashToLowerCamelKeys', () => {
  it('should transform all keys to lower camel case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      'first-name': firstName,
      'nick-name': nickName,
    };
    type ExpectedType = { firstName: string; nickName: string };
    // When
    const result: ExpectedType = dashToLowerCamelKeys<ExpectedType>({
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
        'first-name': firstName,
        'nick-name': nickName,
      },
    };
    type ExpectedType = {
      name: { firstName: string; 'nick-name': string };
    };
    // When
    const result: ExpectedType = dashToLowerCamelKeys<ExpectedType>({
      target,
      include: ['name.first-name'],
    });
    // Then
    expect(result).toEqual({
      name: {
        firstName,
        'nick-name': nickName,
      },
    });
  });

  it('should transform all keys to lower camel case except one', () => {
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
      nameInfo: { 'first-name': string; nickName: string };
    };
    // When
    const result: ExpectedType = dashToLowerCamelKeys<ExpectedType>({
      target,
      exclude: ['name-info.first-name'],
    });
    // Then
    expect(result).toEqual({
      nameInfo: {
        'first-name': firstName,
        nickName,
      },
    });
  });
});
