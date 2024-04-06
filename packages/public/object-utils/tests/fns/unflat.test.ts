jest.unmock('../../src/fns/merge');
jest.unmock('../../src/fns/copy');
jest.unmock('../../src/fns/set');
jest.unmock('../../src/fns/unflat');

import { unflat } from '../../src/fns/unflat';

describe('unflat', () => {
  it('should un-flatten a list of properties into a new object', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const total = 1;
    const numbers = ['one', 'two', 'three'];
    const target = {
      total,
      'person.age': age,
      'person.names.name': name,
      'person.names.nickname': nickname,
      'person.numbers': numbers,
    };
    type ExpectedType = {
      total: number;
      person: {
        age: number;
        names: {
          name: string;
          nickname: string;
        };
        numbers: string[];
      };
    };
    // When
    const result = unflat<ExpectedType>({ target });
    // Then
    expect(result).toEqual({
      total,
      person: {
        age,
        names: {
          name,
          nickname,
        },
        numbers,
      },
    });
  });

  it('should un-flatten a list of properties into a new object using a custom path', () => {
    // Given
    const name = 'Pilar';
    const nickname = 'Pili';
    const age = 3;
    const total = 1;
    const numbers = ['one', 'two', 'three'];
    const separator = '/';
    const target = {
      total,
      [`person${separator}age`]: age,
      [`person${separator}names${separator}name`]: name,
      [`person${separator}names${separator}nickname`]: nickname,
      [`person${separator}numbers`]: numbers,
    };
    type ExpectedType = {
      total: number;
      person: {
        age: number;
        names: {
          name: string;
          nickname: string;
        };
        numbers: string[];
      };
    };
    // When
    const result = unflat<ExpectedType>({
      target,
      pathDelimiter: separator,
    });
    // Then
    expect(result).toEqual({
      total,
      person: {
        age,
        names: {
          name,
          nickname,
        },
        numbers,
      },
    });
  });

  it('should return undefined when trying to un-flatten a property with a forbidden path', () => {
    // Given
    const name = 'Pilar';
    const nickname = 'Pili';
    const age = 4;
    const total = 2;
    const protoProp = 'numbers';
    const protoPropValue = ['one', 'two', 'three'];
    const target = {
      total,
      'person.age': age,
      'person.names.name': name,
      'person.names.nickname': nickname,
      [`__proto__.${protoProp}`]: protoPropValue,
    };
    // When
    const result = unflat({ target });
    // Then
    expect(result).toBeUndefined();
    // @ts-expect-error - We are testing a private property
    expect(Object[protoProp]).not.toBe(protoPropValue);
  });
});
