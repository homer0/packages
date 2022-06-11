jest.unmock('../../src/fns/formatKeys');
jest.unmock('../../src/fns/lowerCamelToDashKeys');

import { lowerCamelToDashKeys } from '../../src/fns/lowerCamelToDashKeys';

describe('lowerCamelToDashKeys', () => {
  it('should transform all keys to dash case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      firstName,
      nickName,
    };
    // When
    const result = lowerCamelToDashKeys<{ 'first-name': string; 'nick-name': string }>({
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
    // When
    const result = lowerCamelToDashKeys<{
      name: { 'first-name': string; nickName: string };
    }>({
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
    // When
    const result = lowerCamelToDashKeys<{
      'name-info': { firstName: string; 'nick-name': string };
    }>({ target, exclude: ['nameInfo.firstName'] });
    // Then
    expect(result).toEqual({
      'name-info': {
        firstName,
        'nick-name': nickName,
      },
    });
  });
});
