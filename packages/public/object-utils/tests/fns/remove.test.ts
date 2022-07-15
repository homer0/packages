jest.unmock('../../src/fns/merge');
jest.unmock('../../src/fns/copy');
jest.unmock('../../src/fns/get');
jest.unmock('../../src/fns/remove');

import { copy } from '../../src/fns/copy';
import { remove } from '../../src/fns/remove';

describe('remove', () => {
  it('should delete a property from an object using its name', () => {
    // Given
    const topElement = 'name';
    const target = {
      [topElement]: 'something',
    };
    const targetCopy = copy(target);
    // When
    const result = remove({ target, path: topElement });
    // Then
    expect(result).toEqual({});
    expect(target).toEqual(targetCopy);
  });

  it('should delete a property from an object using its path', () => {
    // Given
    const topElement = 'name';
    const childElement = 'first';
    const target = {
      [topElement]: {
        [childElement]: 'something',
      },
    };
    const targetCopy = copy(target);
    // When
    const result = remove({ target, path: `${topElement}.${childElement}` });
    // Then
    expect(result).toEqual({});
    expect(target).toEqual(targetCopy);
  });

  it('should delete a property using the short form', () => {
    // Given
    const topElement = 'name';
    const childElement = 'first';
    const target = {
      [topElement]: {
        [childElement]: 'something',
      },
    };
    const targetCopy = copy(target);
    // When
    const result = remove(target, `${topElement}.${childElement}`);
    // Then
    expect(result).toEqual({});
    expect(target).toEqual(targetCopy);
  });

  it('should delete a property from an object using a custom path', () => {
    // Given
    const topElement = 'name';
    const childElement = 'first';
    const otherElement = 'last';
    const otherElementValue = 'last name';
    const target = {
      [topElement]: {
        [childElement]: 'something',
        [otherElement]: otherElementValue,
      },
    };
    const targetCopy = copy(target);
    const delimiter = '/';
    type ExpectedType = {
      [topElement]: {
        [otherElement]: typeof otherElementValue;
      };
    };
    // When
    const result: ExpectedType | undefined = remove<ExpectedType>({
      target,
      path: `${topElement}${delimiter}${childElement}`,
      pathDelimiter: delimiter,
    });
    // Then
    expect(result).toEqual({
      [topElement]: {
        [otherElement]: otherElementValue,
      },
    });
    expect(target).toEqual(targetCopy);
  });

  it('should delete a property from an object but not clean the parent object', () => {
    // Given
    const topElement = 'name';
    const childElement = 'first';
    const target = {
      [topElement]: {
        [childElement]: 'something',
      },
    };
    const targetCopy = copy(target);
    type ExpectedType = {
      [topElement]: Record<string, unknown>;
    };
    // When
    const result: ExpectedType | undefined = remove({
      target,
      path: `${topElement}.${childElement}`,
      cleanEmptyProperties: false,
    });
    // Then
    expect(result).toEqual({
      [topElement]: {},
    });
    expect(target).toEqual(targetCopy);
  });

  it('should return undefiend when given an invalid path', () => {
    // Given
    const target = {};
    // When
    const result = remove({
      target,
      path: 'some.fake.path',
    });
    // Then
    expect(result).toBeUndefined();
  });
});
