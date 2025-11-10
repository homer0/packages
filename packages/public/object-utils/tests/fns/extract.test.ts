jest.unmock('@src/fns/merge.js');
jest.unmock('@src/fns/copy.js');
jest.unmock('@src/fns/get.js');
jest.unmock('@src/fns/set.js');
jest.unmock('@src/fns/extract.js');

import { copy } from '@src/fns/copy.js';
import { extract } from '@src/fns/extract.js';

describe('extract', () => {
  it('should extract a list of properties from an object', () => {
    // Given
    const paths = ['name', 'address'];
    const pathsObject = paths.reduce<Record<string, string>>(
      (acc, name) => ({ ...acc, [name]: `${name}-value` }),
      {},
    );
    const target = {
      ...pathsObject,
      random: 'value',
      planet: 'earth',
    };
    const targetCopy = copy(target);
    type ExpectedType = Record<string, string>;
    // When
    const result: ExpectedType | undefined = extract<ExpectedType>({ target, paths });
    // Then
    expect(result).toEqual(pathsObject);
    expect(target).toEqual(targetCopy);
  });

  it('should extract a property with a path', () => {
    // Given
    const topElement = 'person';
    const childElement = 'name';
    const childElementValue = 'Rosario';
    const target = {
      [topElement]: {
        [childElement]: [childElementValue],
        age: 3,
        planet: 'earth',
      },
    };
    type ExpectedType = {
      [topElement]: {
        [childElement]: string[];
      };
    };
    // When
    const result: ExpectedType | undefined = extract<ExpectedType>({
      target,
      paths: [`${topElement}.${childElement}`],
    });
    // Then
    expect(result).toEqual({
      [topElement]: {
        [childElement]: [childElementValue],
      },
    });
  });

  it('should extract a property with a custom path into a custom location', () => {
    // Given
    const topElement = 'person';
    const childElement = 'name';
    const childElementValue = 'Rosario';
    const target = {
      [topElement]: {
        [childElement]: [childElementValue],
        age: 3,
        planet: 'earth',
      },
    };
    const delimiter = '/';
    type ExpectedType = {
      [childElement]: string;
    };
    // When
    const result: ExpectedType | undefined = extract<ExpectedType>({
      target,
      paths: {
        [childElement]: `${topElement}${delimiter}${childElement}`,
      },
      pathDelimiter: '/',
    });
    // Then
    expect(result).toEqual({
      [childElement]: [childElementValue],
    });
  });

  it("shouldn't throw an error when trying to extract from an invalid path", () => {
    // Given
    const topElement = 'person';
    const target = {};
    // When
    const result = extract({ target, paths: topElement });
    // Then
    expect(result).toEqual({});
  });

  it('should throw an error when trying to extract from an invalid path', () => {
    // Given
    const topElement = 'person';
    const target = {};
    // When/Then
    expect(() => extract({ target, paths: topElement, failWithError: true })).toThrow(
      new RegExp(`There's nothing on '${topElement}'`, 'i'),
    );
  });

  it("shouldn't throw an error when trying to extract reusing a path", () => {
    // Given
    const topElement = 'person';
    const childElement = 'name';
    const childElementValue = 'Rosario';
    const target = {
      [topElement]: {
        [childElement]: childElementValue,
        age: 3,
        planet: 'earth',
      },
    };
    // When
    const result = extract({
      target,
      paths: [
        { [topElement]: `${topElement}.${childElement}` },
        { [`${topElement}.${childElement}`]: `${topElement}.${childElement}` },
      ],
    });
    // Then
    expect(result).toBeUndefined();
  });

  it('should throw an error when trying to extract reusing a path', () => {
    // Given
    const topElement = 'person';
    const childElement = 'name';
    const childElementValue = 'Rosario';
    const target = {
      [topElement]: {
        [childElement]: childElementValue,
        age: 3,
        planet: 'earth',
      },
    };
    // When/Then
    expect(() =>
      extract({
        target,
        paths: [
          { [topElement]: `${topElement}.${childElement}` },
          { [`${topElement}.${childElement}`]: `${topElement}.${childElement}` },
        ],
        failWithError: true,
      }),
    ).toThrow(
      new RegExp(`There's already an element of type 'string' on '${topElement}'`, 'i'),
    );
  });
});
