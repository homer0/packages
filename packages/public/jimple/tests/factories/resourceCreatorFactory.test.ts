import { resourceCreatorFactory } from '@src/factories/index.js';

describe('resourceCreatorFactory', () => {
  it('should create a resource creator', () => {
    // Given
    type ResourceFn = (arg0: string) => string;
    const name = 'providerCreator';
    const key = 'register';
    const resourceFn: ResourceFn = jest.fn(() => 'Batman');
    const creatorFn = jest.fn(() => resourceFn);
    // When
    const sut = resourceCreatorFactory<ResourceFn>()(name, key, creatorFn);
    // Then
    expect(sut[name]).toBe(true);
    expect(sut[key]).toBe(resourceFn);
    expect(creatorFn).toHaveBeenCalledTimes(1);
  });

  it('should only create the non-configured resource once', () => {
    // Given
    type ResourceFn = (arg0: string) => string;
    const name = 'providerCreator';
    const key = 'register';
    const resourceFn: ResourceFn = jest.fn(() => 'Pilar');
    const creatorFn = jest.fn(() => resourceFn);
    // When
    const sut = resourceCreatorFactory<ResourceFn>()(name, key, creatorFn);
    // Then
    expect(sut[name]).toBe(true);
    expect(name in sut).toBe(true);
    expect(key in sut).toBe(true);
    expect('apply' in sut).toBe(true);
    expect(sut[key]).toBe(resourceFn);
    expect(sut.apply).toEqual(expect.any(Function));
    // eslint-disable-next-line dot-notation
    expect(sut['invalid']).toBe(undefined);
    expect(creatorFn).toHaveBeenCalledTimes(1);
  });

  it('should allow to configure the resource (multiple times)', () => {
    // Given
    type ResourceFn = (arg0?: string) => string;
    const name = 'providerCreator';
    const key = 'register';
    const finalResource = 'Batman';
    const prefixArgOne = 'prefix:';
    const prefixArgTwo = 'other:';
    const creatorFn = jest.fn((arg0: string = '') =>
      jest.fn(() => `${arg0}${finalResource}`),
    );
    // When
    const sut = resourceCreatorFactory<ResourceFn>()(name, key, creatorFn);
    const configuredResultOne = sut(prefixArgOne).register();
    const configuredResultTwo = sut(prefixArgTwo).register();
    // Then
    expect(configuredResultOne).toBe(`${prefixArgOne}${finalResource}`);
    expect(configuredResultTwo).toBe(`${prefixArgTwo}${finalResource}`);
  });

  it('should allow to configure the resource', () => {
    // Given
    type ResourceFn = (arg0: string) => string;
    const name = 'providerCreator';
    const key = 'register';
    const resourceFn: ResourceFn = jest.fn(() => 'Rosario');
    const creatorFn = jest.fn(() => resourceFn);
    const arg = 'hello world';
    // When
    const sut = resourceCreatorFactory<ResourceFn>()(name, key, creatorFn);
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
