jest.unmock('@src/createConfigSlice.js');

import { createConfigSlice } from '@src/createConfigSlice.js';

describe('createConfigSlice', () => {
  const sliceName = 'dummy';
  const sliceConfig = {
    valueOne: '1',
    valueTwo: '2',
  } as const;

  it('should create a slice with name and config', () => {
    // Given/When
    const sut = createConfigSlice(sliceName, () => sliceConfig);
    const config = sut();
    // Then
    expect(sut).toBeInstanceOf(Function);
    expect(sut.sliceName).toBe(sliceName);
    expect(config).toBe(sliceConfig);
  });
});
