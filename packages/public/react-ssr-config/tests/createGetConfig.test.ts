vi.mock('@src/store.js');

import { describe, it, expect, beforeEach, type Mock } from 'vitest';
import { createGetConfig, getConfig, resetGetConfig } from '@src/createGetConfig.js';
import { getStore } from '@src/store.js';

const getStoreMock = getStore as Mock;

describe('createGetConfig', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetGetConfig();
  });

  it('should throw if no config with name is found', () => {
    // Given
    getStoreMock.mockReturnValueOnce({});
    /// When/Then
    expect(() => createGetConfig('my-config')).toThrow(
      /no config with name "my-config" found/i,
    );
  });

  it('should return the getConfig method from the config', () => {
    // Given
    const configName = 'my-config';
    const config = {
      getConfig: vi.fn(),
    };
    getStoreMock.mockReturnValueOnce({
      [configName]: config,
    });
    // When
    const sut = createGetConfig(configName);
    // Then
    expect(sut).toBe(config.getConfig);
  });

  it('should return the getConfig method from the config with the default name', () => {
    // Given
    const config = {
      getConfig: vi.fn(),
    };
    getStoreMock.mockReturnValueOnce({
      main: config,
    });
    // When
    const sut = createGetConfig();
    // Then
    expect(sut).toBe(config.getConfig);
  });

  describe('Default getConfig', () => {
    it('should return the getConfig from the config with the default name', () => {
      // Given
      const returnValue = 'Rosario';
      const config = {
        getConfig: vi.fn(() => returnValue),
      };
      getStoreMock.mockReturnValueOnce({
        main: config,
      });
      // When
      const sut = getConfig();
      // Then
      expect(sut).toBe(returnValue);
    });

    it('should cache the getConfig reference', () => {
      // Given
      const returnValue = 'Pilar';
      const config = {
        getConfig: vi.fn(() => returnValue),
      };
      getStoreMock.mockReturnValueOnce({
        main: config,
      });
      // When
      const sut = getConfig();
      const sut2 = getConfig();
      // Then
      expect(sut).toBe(returnValue);
      expect(sut2).toBe(returnValue);
      expect(getStoreMock).toHaveBeenCalledTimes(1);
    });
  });
});
