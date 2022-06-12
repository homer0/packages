jest.unmock('../../src/fns/resource');

import { resource } from '../../src/fns/resource';

describe('resource', () => {
  it('should create an resource', () => {
    // Given
    const name = 'provider';
    const key = 'register';
    const fn = jest.fn();
    const arg = 'hello world';
    type ExpectedType = {
      [name]: true;
      [key]: typeof fn;
    };
    // When
    const result: ExpectedType = resource(name, key, fn);
    result[key](arg);
    // Then
    expect(result).toEqual({
      [name]: true,
      [key]: fn,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
