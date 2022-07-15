jest.unmock('../../src/fns/merge');
jest.unmock('../../src/fns/copy');
jest.unmock('../../src/fns/set');

import { copy } from '../../src/fns/copy';
import { set } from '../../src/fns/set';

describe('set', () => {
  it('should set a property on an object using its name', () => {
    // Given
    const target = {};
    const objPath = 'planet';
    const value = 'earth';
    type ExpectedType = {
      [objPath]: string;
    };
    // When
    const result: ExpectedType | undefined = set<ExpectedType>({
      target,
      path: objPath,
      value,
    });
    // Then
    expect(result).toEqual({ [objPath]: value });
    expect(target).toEqual({});
  });

  it('should set a property on an object using a path', () => {
    // Given
    const topElement = 'person';
    const target = {
      [topElement]: {},
    };
    const targetCopy = copy(target);
    const childElement = 'name';
    const objPath = `${topElement}.${childElement}`;
    const value = 'Rosario';
    type ExpectedType = {
      [topElement]: {
        [childElement]: typeof value;
      };
    };
    // When
    const result: ExpectedType | undefined = set<ExpectedType>({
      target,
      path: objPath,
      value,
    });
    // Then
    expect(result).toEqual({
      [topElement]: {
        [childElement]: value,
      },
    });
    expect(target).toEqual(targetCopy);
  });

  it('should set a property using the short form', () => {
    // Given
    const topElement = 'person';
    const target = {
      [topElement]: {},
    };
    const targetCopy = copy(target);
    const childElement = 'name';
    const objPath = `${topElement}.${childElement}`;
    const value = 'Rosario';
    type ExpectedType = {
      [topElement]: {
        [childElement]: typeof value;
      };
    };
    // When
    const result: ExpectedType | undefined = set<ExpectedType>(target, objPath, value);
    // Then
    expect(result).toEqual({
      [topElement]: {
        [childElement]: value,
      },
    });
    expect(target).toEqual(targetCopy);
  });

  it('should set a property on an object using a custom path', () => {
    // Given
    const topElement = 'person';
    const target = {
      [topElement]: {},
    };
    const targetCopy = copy(target);
    const childElement = 'name';
    const grandChildElement = 'first';
    const delimiter = '/';
    const objPath = `${topElement}${delimiter}${childElement}${delimiter}${grandChildElement}`;
    const value = 'Rosario';
    type ExpectedType = {
      [topElement]: {
        [childElement]: {
          [grandChildElement]: typeof value;
        };
      };
    };
    // When
    const result: ExpectedType | undefined = set({
      target,
      path: objPath,
      value,
      pathDelimiter: delimiter,
    });
    // Then
    expect(result).toEqual({
      [topElement]: {
        [childElement]: {
          [grandChildElement]: value,
        },
      },
    });
    expect(target).toEqual(targetCopy);
  });

  it('should set a property on an object using a path and support arrays', () => {
    // Given
    const topElement = 'people';
    const childElement = 'name';
    const age = 3;
    const firstEntry = { [childElement]: 'Charito', age };
    const target = {
      [topElement]: [firstEntry, { age }],
    };
    const targetCopy = copy(target);
    const objPath = `${topElement}.1.${childElement}`;
    const value = 'Rosario';
    type ExpectedType = {
      [topElement]: Array<{
        [childElement]: string;
        age: number;
      }>;
    };
    // When
    const result: ExpectedType | undefined = set<ExpectedType>({
      target,
      path: objPath,
      value,
    });
    // Then
    expect(result).toEqual({
      [topElement]: [
        firstEntry,
        {
          [childElement]: value,
          age,
        },
      ],
    });
    expect(target).toEqual(targetCopy);
  });

  it("shouldn't throw an error when trying to set a property on an non object path", () => {
    // Given
    const topElement = 'people';
    const childElement = 'name';
    const grandChildElement = 'first';
    const value = 'Rosario';
    const target = {
      [topElement]: {
        [childElement]: value,
      },
    };
    const objPath = `${topElement}.${childElement}.${grandChildElement}`;
    // When
    const result = set({ target, path: objPath, value });
    // Then
    expect(result).toBeUndefined();
  });

  it('should throw an error when trying to set a property on an non object path', () => {
    // Given
    const topElement = 'people';
    const childElement = 'name';
    const grandChildElement = 'first';
    const value = 'Rosario';
    const target = {
      [topElement]: {
        [childElement]: value,
      },
    };
    const objPath = `${topElement}.${childElement}.${grandChildElement}`;
    // When/Then
    expect(() => set({ target, path: objPath, value, failWithError: true })).toThrow(
      new RegExp(
        `There's already an element of type 'string' on '${topElement}.${childElement}'`,
        'i',
      ),
    );
  });
});
