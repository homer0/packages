jest.unmock('../src/index.js');

import { extendPromise } from '../src/index.js';

describe('extendPromise', () => {
  it('should throw an error when called with anything but a promise', () => {
    // Given/When/Then
    // @ts-expect-error - we're testing the error
    expect(() => extendPromise()).toThrow(/'promise' must be a valid Promise instance/i);
  });

  it('should throw an error when called without extended properties', () => {
    // Given/When/Then
    // @ts-expect-error - we're testing the error
    expect(() => extendPromise(Promise.resolve())).toThrow(
      /'properties' must be an object with at least one key/i,
    );
  });

  it('should throw an error when called with an empty object', () => {
    // Given/When/Then
    expect(() => extendPromise(Promise.resolve(), {})).toThrow(
      /'properties' must be an object with at least one key/i,
    );
  });

  it('should extend a promise chain', async () => {
    // Given
    const promise = Promise.resolve(0);
    const properties = {
      custom: 2509,
    };
    // When
    let sut = extendPromise(promise, properties);
    const valueAfterCreation = sut.custom;
    sut = sut.then(() => 1);
    const valueAfterFirstThen = sut.custom;
    sut = sut.then(() => 2);
    const valueAfterSecondThen = sut.custom;
    sut = sut.catch((error) => Promise.reject(error));
    const valueAfterCatch = sut.custom;
    await sut;
    // Then
    expect(sut).toBeInstanceOf(Promise);
    expect(sut.custom).toBe(properties.custom);
    expect(valueAfterCreation).toBe(properties.custom);
    expect(valueAfterFirstThen).toBe(properties.custom);
    expect(valueAfterSecondThen).toBe(properties.custom);
    expect(valueAfterCatch).toBe(properties.custom);
  });

  it('should use a native method even if a property tries to overwrite it', async () => {
    // Given
    const promise = Promise.resolve();
    const properties = {
      toString: jest.fn(),
    };
    let sut = null;
    let result = null;
    // When
    sut = extendPromise(promise, properties);
    result = sut.toString();
    await sut;
    // Then
    expect(result).toEqual(promise.toString());
    expect(properties.toString).toHaveBeenCalledTimes(0);
  });
});
