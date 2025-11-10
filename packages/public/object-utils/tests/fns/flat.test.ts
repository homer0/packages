jest.unmock('@src/fns/merge.js');
jest.unmock('@src/fns/copy.js');
jest.unmock('@src/fns/flat.js');

import { flat } from '@src/fns/flat.js';

describe('flat', () => {
  it('should flattern the properties of an object', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const alias = null;
    const age = 3;
    const total = 1;
    const numbers = ['one', 'two', 'three'];
    const target = {
      total,
      person: {
        age,
        names: {
          name,
          nickname,
          alias,
        },
        numbers,
      },
    };
    type ExpectedType = {
      total: number;
      'person.age': number;
      'person.names.name': string;
      'person.names.nickname': string;
      'person.names.alias': null;
      'person.numbers.0': string;
      'person.numbers.1': string;
      'person.numbers.2': string;
    };
    const expected = {
      total,
      'person.age': age,
      'person.names.name': name,
      'person.names.nickname': nickname,
      'person.names.alias': alias,
      ...numbers.reduce(
        (acc, item, index) => ({ ...acc, [`person.numbers.${index}`]: item }),
        {},
      ),
    };
    // When
    const result: ExpectedType = flat<ExpectedType>({ target });
    // Then
    expect(result).toEqual(expected);
  });

  it('should flattern the properties of an object using a custom path', () => {
    // Given
    const name = 'Pilar';
    const nickname = 'Pili';
    const age = 3;
    const total = 1;
    const numbers = ['one', 'two', 'three'];
    const target = {
      total,
      person: {
        age,
        names: {
          name,
          nickname,
        },
        numbers,
      },
    };
    const separator = '/';
    type ExpectedType = {
      total: number;
      'person/age': number;
      'person/names/name': string;
      'person/names/nickname': string;
      'person/numbers/0': string;
      'person/numbers/1': string;
      'person/numbers/2': string;
    };
    const expected = {
      total,
      [`person${separator}age`]: age,
      [`person${separator}names${separator}name`]: name,
      [`person${separator}names${separator}nickname`]: nickname,
      ...numbers.reduce(
        (acc, item, index) => ({
          ...acc,
          [`person${separator}numbers${separator}${index}`]: item,
        }),
        {},
      ),
    };
    // When
    const result: ExpectedType = flat<ExpectedType>({ target, pathDelimiter: separator });
    // Then
    expect(result).toEqual(expected);
  });

  it('should flattern the properties except those filtered by a callback', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const age = 3;
    const total = 1;
    const numbers = ['one', 'two', 'three'];
    const target = {
      total,
      person: {
        age,
        names: {
          name,
          nickname,
        },
        numbers,
      },
    };
    type ExpectedType = {
      total: number;
      'person.age': number;
      'person.names.name': string;
      'person.names.nickname': string;
      'person.numbers': string[];
    };
    // When
    const result: ExpectedType = flat<ExpectedType>({
      target,
      shouldFlatten: (_, value) => !Array.isArray(value),
    });
    // Then
    expect(result).toEqual({
      total,
      'person.age': age,
      'person.names.name': name,
      'person.names.nickname': nickname,
      'person.numbers': numbers,
    });
  });
});
