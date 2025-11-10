jest.unmock('../src/config.js');
jest.unmock('../src/createConfig.js');
jest.unmock('../src/createConfigSlice.js');
jest.unmock('../src/store.js');

import { Config } from '../src/config.js';
import { createConfig } from '../src/createConfig.js';
import { createConfigSlice } from '../src/createConfigSlice.js';
import { resetStore } from '../src/store.js';
import { isServer } from '../src/utils.js';
import type { ConfigSlice } from '../src/types.js';

const isServerMock = isServer as jest.MockedFunction<typeof isServer>;

describe('Config', () => {
  const configName = 'my-config';
  const dummySliceName = 'dummy';
  const dummySliceConfig = {
    valueOne: '1',
    valueTwo: '2',
  } as const;
  let dummySlice: ConfigSlice<typeof dummySliceName, typeof dummySliceConfig>;

  const getSlices = () => ({
    [dummySliceName]: dummySlice,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    dummySlice = createConfigSlice(dummySliceName, () => dummySliceConfig);
    isServerMock.mockReturnValue(true);
    resetStore();
  });

  it('should create a config with name and slices', () => {
    // Given/When
    const sut = createConfig({
      name: configName,
      slices: getSlices(),
    });
    const allConfig = sut.getConfig();
    const sliceConfig = sut.getConfig(dummySliceName);
    // Then
    expect(sut).toBeInstanceOf(Config);
    expect(sut.configName).toBe(configName);
    expect(sut.scriptId).toBe(`__NEXT_SSR_CONFIG-${configName}__`);
    expect(allConfig).toEqual({
      [dummySliceName]: dummySliceConfig,
    });
    expect(sliceConfig).toBe(dummySliceConfig);
  });

  it('should create a config with only slices', () => {
    // Given/When
    const sut = createConfig(getSlices());
    const allConfig = sut.getConfig();
    const sliceConfig = sut.getConfig(dummySliceName);
    // Then
    expect(sut).toBeInstanceOf(Config);
    expect(sut.configName).toBe('main');
    expect(sut.scriptId).toBe(`__NEXT_SSR_CONFIG-main__`);
    expect(allConfig).toEqual({
      [dummySliceName]: dummySliceConfig,
    });
    expect(sliceConfig).toBe(dummySliceConfig);
  });

  it('should overwrite an existing config and not throw', () => {
    // Given
    const slices = getSlices();
    // When
    const firstConfig = createConfig(slices);
    const secondConfig = createConfig({
      slices,
      overwrite: true,
    });
    // Then
    expect(firstConfig).toBeInstanceOf(Config);
    expect(secondConfig).toBeInstanceOf(Config);
    expect(firstConfig).not.toBe(secondConfig);
  });

  it('should throw when another config was created with the same name', () => {
    // Given
    const slices = getSlices();
    // When/Then
    createConfig(slices);
    expect(() => createConfig(slices)).toThrow(/the config "main" already exists/i);
  });
});
