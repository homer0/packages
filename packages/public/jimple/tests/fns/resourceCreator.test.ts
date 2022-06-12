jest.unmock('../../src/fns/resource');
jest.unmock('../../src/fns/resourceCreator');

import { resourceCreator } from '../../src/fns/resourceCreator';

describe('resourceCreator', () => {
  it('should create a resource creator', () => {
    // Given
    const name = 'providerCreator';
    const key = 'register';
    const resourceFn = jest.fn(() => 'Batman');
    const creatorFn = jest.fn(() => resourceFn);
    // When
    const sut = resourceCreator(name, key, creatorFn);
    // Then
    expect(sut[name]).toBe(true);
    expect(sut[key]).toBe(resourceFn);
    expect(creatorFn).toHaveBeenCalledTimes(1);
  });

  it('should only create the non-configured resource once', () => {
    // Given
    const name = 'providerCreator';
    const key = 'register';
    const resourceFn = jest.fn(() => 'Pilar');
    const creatorFn = jest.fn(() => resourceFn);
    // When
    const sut = resourceCreator(name, key, creatorFn);
    // Then
    expect(sut[name]).toBe(true);
    expect(sut[key]).toBe(resourceFn);
    // eslint-disable-next-line dot-notation
    expect(sut['invalid']).toBe(undefined);
    expect(creatorFn).toHaveBeenCalledTimes(1);
  });

  it('should allow to configure the resource', () => {
    // Given
    const name = 'providerCreator';
    const key = 'register';
    const resourceFn = jest.fn(() => 'Rosario');
    const creatorFn = jest.fn(() => resourceFn);
    const arg = 'hello world';
    // When
    const sut = resourceCreator(name, key, creatorFn);
    // @ts-expect-error - we're testing that the argument is being sent.
    const configured = sut(arg);
    // Then
    expect(configured).toStrictEqual({
      [name]: true,
      [key]: resourceFn,
    });
    expect(creatorFn).toHaveBeenCalledTimes(1);
    expect(creatorFn).toHaveBeenCalledWith(arg);
  });
});
