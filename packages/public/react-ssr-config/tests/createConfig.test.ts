jest.unmock('../src/config');
jest.unmock('../src/createConfig');
jest.unmock('../src/createConfigSlice');
jest.unmock('../src/store');

import { Config } from '../src/config';
import { createConfig } from '../src/createConfig';
import { createConfigSlice } from '../src/createConfigSlice';
import { resetStore } from '../src/store';
import { isServer } from '../src/utils';
import type { ConfigSlice } from '../src/types';

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

  it('should throw when another config was created with the same name', () => {
    // Given
    const slices = getSlices();
    // When/Then
    createConfig(slices);
    expect(() => createConfig(slices)).toThrow(/the config "main" already exists/i);
  });
});
