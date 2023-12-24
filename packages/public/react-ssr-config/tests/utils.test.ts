jest.unmock('../src/utils');

import { isServer } from '../src/utils';

describe('isServer', () => {
  let originalWindow: typeof global.window;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should return true when window is not defined', () => {
    // Given
    // @ts-expect-error -- we are testing the case when window is not defined.
    delete global.window;
    // When
    const sut = isServer();
    // Then
    expect(sut).toBe(true);
  });

  it('should return false when window is defined', () => {
    // Given/When
    const sut = isServer();
    // Then
    expect(sut).toBe(false);
  });
});
