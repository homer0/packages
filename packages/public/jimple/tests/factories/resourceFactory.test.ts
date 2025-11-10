import { resourceFactory } from '../../src/factories/index.js';

describe('resourceFactory', () => {
  it('should create an resource', () => {
    // Given
    type ResourceFn = (arg0: string) => string;
    const name = 'provider';
    const key = 'register';
    const fn: ResourceFn = jest.fn((arg0) => arg0);
    const arg = 'hello world';
    type ExpectedType = {
      [name]: true;
      [key]: typeof fn;
    };
    // When
    const providerFactory = resourceFactory<ResourceFn>();
    const result: ExpectedType = providerFactory(name, key, fn);
    result[key](arg);
    // Then
    expect(result).toEqual({
      [name]: true,
      [key]: fn,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
