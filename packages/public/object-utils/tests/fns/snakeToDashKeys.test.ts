import { describe, it, expect } from 'vitest';
import { snakeToDashKeys } from '@src/fns/snakeToDashKeys.js';

describe('snakeToDashKeys', () => {
  it('should transform all keys to dash case', () => {
    // Given
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      first_name: firstName,
      nick_name: nickName,
    };
    type ExpectedType = { 'first-name': string; 'nick-name': string };
    // When
    const result: ExpectedType = snakeToDashKeys<ExpectedType>({
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
    const firstName = 'Rosario';
    const nickName = 'Charito';
    const target = {
      name: {
        first_name: firstName,
        nick_name: nickName,
      },
    };
    type ExpectedType = { name: { 'first-name': string; nick_name: string } };
    // When
    const result: ExpectedType = snakeToDashKeys<ExpectedType>({
      target,
      include: ['name.first_name'],
    });
    // Then
    expect(result).toEqual({
      name: {
        'first-name': firstName,
        nick_name: nickName,
      },
    });
  });

  it('should transform all keys to dash case except one', () => {
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
      'name-info': { first_name: string; 'nick-name': string };
    };
    // When
    const result: ExpectedType = snakeToDashKeys<ExpectedType>({
      target,
      exclude: ['name_info.first_name'],
    });
    // Then
    expect(result).toEqual({
      'name-info': {
        first_name: firstName,
        'nick-name': nickName,
      },
    });
  });
});
