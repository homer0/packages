jest.unmock('@src/store');

import { getStore, resetStore } from '@src/store.js';
import type { Config } from '@src/config.js';
import type { GenericConfig, ConfigSlice } from '@src/types.js';

describe('store', () => {
  const dummyConfigName = 'dummy';
  const dummyConfig = {
    hello: 'world',
  } as unknown as Config<Record<string, ConfigSlice<string, GenericConfig>>>;

  beforeEach(() => {
    resetStore();
  });

  it('should return the store', () => {
    // Given/When
    const sut = getStore();
    const beforeUpdate = { ...sut };
    sut[dummyConfigName] = dummyConfig;
    const afterUpdate = getStore();
    // Then
    expect(beforeUpdate).toEqual({});
    expect(afterUpdate).toEqual({
      [dummyConfigName]: dummyConfig,
    });
  });

  it('should reset the store', () => {
    // Given/When
    const sut = getStore();
    sut[dummyConfigName] = dummyConfig;
    const beforeReset = { ...getStore() };
    resetStore();
    const afterReset = getStore();
    // Then
    expect(beforeReset).toEqual({
      [dummyConfigName]: dummyConfig,
    });
    expect(afterReset).toEqual({});
  });
});
