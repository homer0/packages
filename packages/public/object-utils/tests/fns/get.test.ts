jest.unmock('@src/fns/get.js');

import { get } from '@src/fns/get.js';

describe('get', () => {
  it('should read a property from an object using its name', () => {
    // Given
    const target = {
      city: 'Springfield',
    };
    // When
    const result: string | undefined = get<string>({ target, path: 'city' });
    // Then
    expect(result).toBe(target.city);
  });

  it('should read a property from an object using a path', () => {
    // Given
    const name = 'Springfield';
    const target = {
      address: {
        city: {
          name,
        },
      },
    };
    // When
    const result: string | undefined = get({ target, path: 'address.city.name' });
    // Then
    expect(result).toBe(name);
  });

  it('should read a property using the short form', () => {
    // Given
    const name = 'Springfield';
    const target = {
      address: {
        city: {
          name,
        },
      },
    };
    // When
    const result: string | undefined = get(target, 'address.city.name');
    // Then
    expect(result).toBe(name);
  });

  it('should read a property from an object using a custom path', () => {
    // Given
    const name = 'Springfield';
    const target = {
      address: {
        city: {
          name,
        },
      },
    };
    // When
    const result: string | undefined = get({
      target,
      path: 'address/city/name',
      pathDelimiter: '/',
    });
    // Then
    expect(result).toBe(name);
  });

  it('should read a property from an object and support arrays', () => {
    // Given
    const name = 'Springfield';
    const target = {
      addressList: [
        { city: null },
        {
          city: {
            name,
          },
        },
      ],
    };
    // When
    const result: string | undefined = get({ target, path: 'addressList.1.city.name' });
    // Then
    expect(result).toBe(name);
  });

  it("shouldn't throw an error when trying to read a property that doesn't exist", () => {
    // Given
    const target = {};
    const fakePath = 'something';
    // When
    const result = get({ target, path: fakePath });
    // Then
    expect(result).toBeUndefined();
  });

  it("shouldn't throw an error when trying to read a path that doesn't exist", () => {
    // Given
    const topElement = 'person';
    const childElement = 'name';
    const target = {
      [topElement]: {},
    };
    const fakePath = `${topElement}.${childElement}`;
    // When
    const result = get({ target, path: fakePath, failWithError: false });
    // Then
    expect(result).toBeUndefined();
  });

  it("should throw an error when trying to read a property that doesn't exist", () => {
    // Given
    const target = {};
    const fakePath = 'something';
    // When/Then
    expect(() => get({ target, path: fakePath, failWithError: true })).toThrow(
      new RegExp(`there's nothing on '${fakePath}'`, 'i'),
    );
  });

  it("should throw an error when trying to read a path that doesn't exist", () => {
    // Given
    const topElement = 'person';
    const childElement = 'name';
    const grandChildElement = 'first';
    const target = {
      [topElement]: {},
    };
    const fakePath = `${topElement}.${childElement}.${grandChildElement}`;
    // When/Then
    expect(() => get({ target, path: fakePath, failWithError: true })).toThrow(
      new RegExp(`there's nothing on '${topElement}.${childElement}'`, 'i'),
    );
  });
});
