jest.unmock('@src/fns/formatKeys.js');
jest.unmock('@src/fns/lowerCamelToDashKeys.js');

import { lowerCamelToDashKeys } from '@src/fns/lowerCamelToDashKeys.js';

describe('lowerCamelToDashKeys', () => {
  it('should transform all keys to dash case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      firstName,
      nickName,
    };
    type ExpectedType = { 'first-name': string; 'nick-name': string };
    // When
    const result: ExpectedType = lowerCamelToDashKeys<ExpectedType>({
      target,
    });
    // Then
    expect(result).toEqual({
      'first-name': firstName,
      'nick-name': nickName,
    });
  });

  it('should transform specific keys to dash case', () => {
    // Given
    const firstName = 'Pilar';
    const nickName = 'Pili';
    const target = {
      name: {
        firstName,
        nickName,
      },
    };
    type ExpectedType = {
      name: { 'first-name': string; nickName: string };
    };
    // When
    const result: ExpectedType = lowerCamelToDashKeys<ExpectedType>({
      target,
      include: ['name.firstName'],
    });
    // Then
    expect(result).toEqual({
      name: {
        'first-name': firstName,
        nickName,
      },
    });
  });

  it('should transform all keys to dash case except one', () => {
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
      'name-info': { firstName: string; 'nick-name': string };
    };
    // When
    const result: ExpectedType = lowerCamelToDashKeys<ExpectedType>({
      target,
      exclude: ['nameInfo.firstName'],
    });
    // Then
    expect(result).toEqual({
      'name-info': {
        firstName,
        'nick-name': nickName,
      },
    });
  });
});
