import {
  resourceFactory,
  resourcesCollectionFactory,
} from '../../src/factories/index.js';

describe('resourcesCollectionFactory', () => {
  it('should throw an error if an item uses the name of the resource as key', () => {
    // Given
    type ResourceFn = (arg0: string) => string;
    const name = 'providers';
    const key = 'register';
    const resourceFn: ResourceFn = jest.fn(() => 'Batman');
    const resFactory = resourceFactory<ResourceFn>();
    const res = resFactory('provider', key, resourceFn);
    const resCollection = resourcesCollectionFactory<'provider', ResourceFn>();
    // When/Then
    expect(() => resCollection(name, key)({ [key]: res })).toThrow(
      /No item on the collection can have the keys `\w+` nor `\w+`$/,
    );
  });

  it("should throw an error if an item doesn't have a `key` function", () => {
    // Given
    type ResourceFn = (arg0: string) => string;
    const name = 'providers';
    const key = 'register';
    const resourceFn: ResourceFn = jest.fn(() => 'Batman');
    const resFactory = resourceFactory<ResourceFn>();
    const res = resFactory('provider', 'otherKey', resourceFn);
    const resCollection = resourcesCollectionFactory<'provider', ResourceFn>();
    // When/Then
    // @ts-expect-error - we're testing that the argument is being sent.
    expect(() => resCollection(name, key)({ something: res })).toThrow(
      /The item `\w+` is invalid: it doesn't have a `\w+` function/,
    );
  });

  it('should create a collection', () => {
    // Given
    type ResourceFn = (arg0: string) => string;
    const name = 'providers';
    const key = 'register';
    const resFactory = resourceFactory<ResourceFn>();
    const itemOneFn: ResourceFn = jest.fn(() => 'Rosario');
    const itemOne = resFactory('provider', key, itemOneFn);
    const itemTwoFn: ResourceFn = jest.fn(() => 'Pilar');
    const itemTwo = resFactory('provider', key, itemTwoFn);
    const items = { itemOne, itemTwo };
    const arg = 'hello world';
    const resCollection = resourcesCollectionFactory<'provider', ResourceFn>();
    // When
    const sut = resCollection(name, key)(items);
    sut[key](arg);
    // Then
    expect(sut[name]).toBe(true);
    expect(sut.itemOne).toBe(itemOne);
    expect(sut.itemTwo).toBe(itemTwo);
    expect(itemOne[key]).toHaveBeenCalledTimes(1);
    expect(itemOne[key]).toHaveBeenCalledWith(arg);
    expect(itemTwo[key]).toHaveBeenCalledTimes(1);
    expect(itemTwo[key]).toHaveBeenCalledWith(arg);
  });

  it('should create a collection with a custom function', () => {
    // Given
    type ResourceFn = (...args: string[]) => string;
    const name = 'providers';
    const key = 'register';
    const resFactory = resourceFactory<ResourceFn>();
    const itemOneFn: ResourceFn = jest.fn(() => 'Rosario');
    const itemOne = resFactory('provider', key, itemOneFn);
    const itemTwoFn: ResourceFn = jest.fn(() => 'Pilar');
    const itemTwo = resFactory('provider', key, itemTwoFn);
    const items = { itemOne, itemTwo };
    const arg = 'hello world';
    const extraArg = 'from the mock!';
    const resCollection = resourcesCollectionFactory<'provider', ResourceFn>();
    // When
    const sut = resCollection(name, key, (fnItems, ...rest) => {
      Object.values(fnItems).forEach((fnItem) => {
        fnItem[key](extraArg, ...rest);
      });
    })(items);
    sut[key](arg);
    // Then
    expect(itemOne[key]).toHaveBeenCalledTimes(1);
    expect(itemOne[key]).toHaveBeenCalledWith(extraArg, arg);
    expect(itemTwo[key]).toHaveBeenCalledTimes(1);
    expect(itemTwo[key]).toHaveBeenCalledWith(extraArg, arg);
  });
});
