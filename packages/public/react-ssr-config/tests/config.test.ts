jest.unmock('../src/config.js');
jest.unmock('../src/createConfigSlice.js');

import { Config } from '../src/config.js';
import { createConfigSlice } from '../src/createConfigSlice.js';
import { isServer } from '../src/utils.js';
import type { ConfigSlice } from '../src/types.js';

const isServerMock = isServer as jest.MockedFunction<typeof isServer>;

describe('Config', () => {
  const configName = 'main';
  const configScriptId = 'main-config';
  const dummySliceName = 'dummy';
  const dummySliceConfig = {
    valueOne: '1',
    valueTwo: '2',
  } as const;
  let dummySlice: ConfigSlice<typeof dummySliceName, typeof dummySliceConfig>;

  const getSlices = () => ({
    [dummySliceName]: dummySlice,
  });

  const getConfig = () => ({
    [dummySliceName]: dummySliceConfig,
  });

  const addClientConfigScript = (config?: unknown, raw = false) => {
    let content: unknown = '';
    if (config) {
      content = raw ? config : JSON.stringify(config);
    }

    document.body.innerHTML = `<script id="${configScriptId}">${content}</script>`;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    dummySlice = createConfigSlice(dummySliceName, () => dummySliceConfig);
  });

  it('should be initialized and save the slices on the server', () => {
    // Given
    isServerMock.mockReturnValue(true);
    // When
    const sut = new Config(configName, configScriptId, getSlices());
    const allConfig = sut.getConfig();
    const sliceConfig = sut.getConfig(dummySliceName);
    // Then
    expect(sut).toBeInstanceOf(Config);
    expect(sut.configName).toBe(configName);
    expect(sut.scriptId).toBe(configScriptId);
    expect(allConfig).toEqual(getConfig());
    expect(sliceConfig).toBe(dummySliceConfig);
  });

  it('should throw on the client when the script is not on the page', () => {
    // Given
    isServerMock.mockReturnValue(false);
    // When/Then
    const sut = new Config(configName, configScriptId, getSlices());
    expect(() => sut.getConfig()).toThrow(/the config was not loaded in the client/i);
  });

  it('should throw on the client when the script is empty', () => {
    // Given
    isServerMock.mockReturnValue(false);
    addClientConfigScript();
    // When/Then
    const sut = new Config(configName, configScriptId, getSlices());
    expect(() => sut.getConfig()).toThrow(/the config was not loaded in the client/i);
  });

  it("should throw on the client when the script config can't be parsed", () => {
    // Given
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    isServerMock.mockReturnValue(false);
    addClientConfigScript('invalid config', true);
    // When/Then
    const sut = new Config(configName, configScriptId, getSlices());
    expect(() => sut.getConfig()).toThrow(/unexpected token/i);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/error parsing the config loaded from the client/i),
    );
  });

  it("should load and return the client's config", () => {
    // Given
    isServerMock.mockReturnValue(false);
    addClientConfigScript(getConfig());
    // When
    const sut = new Config(configName, configScriptId, getSlices());
    const allConfig = sut.getConfig();
    const sliceConfig = sut.getConfig(dummySliceName);
    // Then
    expect(allConfig).toEqual({
      [dummySliceName]: dummySliceConfig,
    });
    expect(sliceConfig).toEqual(dummySliceConfig);
  });
});
