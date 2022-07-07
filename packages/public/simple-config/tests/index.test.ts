/* eslint-disable max-classes-per-file */
jest.unmock('../src');

import * as path from 'path';
import { Jimple } from '@homer0/jimple';
import { EnvUtils } from '@homer0/env-utils';
import { RootFile } from '@homer0/root-file';
import {
  SimpleConfig,
  simpleConfig,
  simpleConfigProvider,
  type SimpleConfigOptions,
} from '../src';

describe('SimpleConfig', () => {
  describe('class', () => {
    describe('constructor', () => {
      it('should be instantiated', () => {
        // Given/When
        const sut = new SimpleConfig();
        // Then
        expect(sut).toBeInstanceOf(SimpleConfig);
        expect(sut.getOptions()).toEqual({
          name: 'app',
          envVarName: 'APP_CONFIG',
          path: path.join('config', 'app'),
          defaultConfigName: 'default',
          defaultConfigFilename: 'app.config.js',
          filenameFormat: 'app.[name].config.js',
          allowConfigSwitch: false,
          allowConfigSwitchSetting: true,
        });
        expect(sut.canSwitchConfigs()).toBe(false);
        expect(sut.getConfig()).toEqual({});
        expect(sut.get('name')).toBe('default');
      });

      it('should be instantiated with custom options', () => {
        // Given
        const serviceOptions = {
          name: 'myApp',
          envVarName: 'MY_APP_CONFIG',
          path: 'configs',
          defaultConfigFilename: 'myApp.cfg.js',
          filenameFormat: 'myApp.[name].cfg.js',
          allowConfigSwitch: true,
          allowConfigSwitchSetting: false,
          defaultConfigName: 'base',
        };
        const options: SimpleConfigOptions = {
          ...serviceOptions,
          defaultConfig: {
            oldest: 'Rosario',
            youngest: 'Pilar',
          },
        };
        // When
        const sut = new SimpleConfig(options);
        // Then
        expect(sut).toBeInstanceOf(SimpleConfig);
        expect(sut.getOptions()).toEqual(serviceOptions);
        expect(sut.getConfig()).toEqual(options.defaultConfig);
        expect(sut.get('name')).toBe(options.defaultConfigName);
      });
    });

    describe('getConfig', () => {
      it('should return a config by name', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const config = sut.getConfig();
        const invalid = sut.getConfig('invalid');
        // Then
        expect(config).toEqual(defaultConfig);
        expect(invalid).toBeUndefined();
      });
    });

    describe('setConfig', () => {
      it('should set a config', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const newConfig = {
          oldestAge: 6,
          youngestAge: 2,
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const config = sut.getConfig();
        const updatedConfig = sut.setConfig<typeof defaultConfig & typeof newConfig>(
          newConfig,
        );
        // Then
        expect(config).toEqual(defaultConfig);
        expect(updatedConfig).toEqual({
          ...defaultConfig,
          ...newConfig,
        });
      });

      it('should set a config without merging it', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const newConfig = {
          oldestAge: 6,
          youngestAge: 2,
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const config = sut.getConfig();
        const updatedConfig = sut.setConfig<typeof newConfig>(
          newConfig,
          'default',
          false,
        );
        // Then
        expect(config).toEqual(defaultConfig);
        expect(updatedConfig).toEqual(newConfig);
      });

      it('should set a new config', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const newConfig = {
          oldestAge: 6,
          youngestAge: 2,
        };
        const newConfigName = 'ages';
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const updatedConfig = sut.setConfig<typeof newConfig>(newConfig, newConfigName);
        const config = sut.getConfig();
        // Then
        expect(config).toEqual(defaultConfig);
        expect(updatedConfig).toEqual(newConfig);
      });
    });

    describe('get', () => {
      it('should get a setting by name', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const value = sut.get<string>('oldest');
        // Then
        expect(value).toEqual(defaultConfig.oldest);
      });

      it('should get multiple settings by name', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const value = sut.get<typeof defaultConfig>(['oldest', 'youngest']);
        // Then
        expect(value).toEqual(defaultConfig);
      });

      it('should get multiple settings as an array', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const value = sut.get<string[]>(['oldest', 'youngest'], true);
        // Then
        expect(value).toEqual(Object.values(defaultConfig));
      });
    });

    describe('set', () => {
      it('should set a setting', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        sut.set('ages.oldest', 6);
        const config = sut.getConfig();
        // Then
        expect(config).toEqual({
          ...defaultConfig,
          ages: {
            oldest: 6,
          },
        });
      });

      it('should set multiple settings', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        sut.set({
          'ages.oldest': 6,
          'ages.youngest': 2,
        });
        const config = sut.getConfig();
        // Then
        expect(config).toEqual({
          ...defaultConfig,
          ages: {
            oldest: 6,
            youngest: 2,
          },
        });
      });

      it('should set and merge a setting', () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
          ages: {
            oldest: 6,
          },
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        sut.set('ages', {
          youngest: 2,
        });
        const config = sut.getConfig();
        // Then
        expect(config).toEqual({
          ...defaultConfig,
          ages: {
            oldest: 6,
            youngest: 2,
          },
        });
      });

      it('should throw an error when the key is a str but no value is send', () => {
        // Given/When/Then
        const sut = new SimpleConfig();
        expect(() => sut.set('something')).toThrow(/the value is required/i);
      });
    });

    describe('loadFromFile', () => {
      it('should load the default config from a file', async () => {
        // Given
        const fileConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const importFn = jest.fn();
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(filepath: string): Promise<FileType> {
            importFn(filepath);
            return Promise.resolve(fileConfig as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        // When
        const sut = new SimpleConfig({
          inject: {
            rootFile: myRootFile,
          },
        });
        const config = sut.getConfig();
        const updatedConfig = await sut.loadFromFile();
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(config).toEqual({});
        expect(updatedConfig).toEqual(fileConfig);
        expect(newConfig).toEqual(fileConfig);
        expect(newConfigName).toBe('default');
        expect(importFn).toHaveBeenCalledWith(
          path.join('config', 'app', 'app.config.js'),
        );
      });

      it('should load the default config from transpiled CJS file', async () => {
        // Given
        const fileConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const fileContents = {
          default: fileConfig,
        };
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(): Promise<FileType> {
            return Promise.resolve(fileContents as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        // When
        const sut = new SimpleConfig({
          inject: {
            rootFile: myRootFile,
          },
        });
        const updatedConfig = await sut.loadFromFile();
        // Then
        expect(updatedConfig).toEqual(fileConfig);
      });

      it('should load the default config from a file that exports a fn', async () => {
        // Given
        const fileConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const fileContents = jest.fn(() => fileConfig);
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(): Promise<FileType> {
            return Promise.resolve(fileContents as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          inject: {
            rootFile: myRootFile,
          },
          defaultConfig,
        });
        const updatedConfig = await sut.loadFromFile();
        // Then
        expect(updatedConfig).toEqual(fileConfig);
        expect(fileContents).toHaveBeenCalledWith(defaultConfig);
      });

      it('should load the default config from a file that exports an async fn', async () => {
        // Given
        const fileConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const fileContents = jest.fn(() => Promise.resolve(fileConfig));
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(): Promise<FileType> {
            return Promise.resolve(fileContents as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          inject: {
            rootFile: myRootFile,
          },
          defaultConfig,
        });
        const updatedConfig = await sut.loadFromFile();
        // Then
        expect(updatedConfig).toEqual(fileConfig);
        expect(fileContents).toHaveBeenCalledWith(defaultConfig);
      });

      it('should load a config that extends from another file', async () => {
        // Given
        const fileAConfigName = 'ages';
        const fileBConfigName = 'nicknames';
        const fileAConfigProps = {
          oldestAge: 6,
          youngestAge: 2,
        };
        const fileAConfig = {
          extends: fileBConfigName,
          ...fileAConfigProps,
        };
        const fileBConfig = {
          oldestNickname: 'Charo',
          youngestNickname: 'Pilar',
        };
        let importIndex = -1;
        const imports = [fileAConfig, fileBConfig];
        const importFn = jest.fn();
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(filepath: string): Promise<FileType> {
            importFn(filepath);
            importIndex++;
            return Promise.resolve(imports[importIndex] as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const expectedConfig = {
          ...defaultConfig,
          ...fileAConfigProps,
          ...fileBConfig,
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
          inject: {
            rootFile: myRootFile,
          },
        });
        const updatedConfig = await sut.loadFromFile(fileAConfigName);
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(updatedConfig).toEqual(expectedConfig);
        expect(newConfig).toEqual(expectedConfig);
        expect(newConfigName).toBe(fileAConfigName);
        expect(importFn).toHaveBeenCalledTimes(2);
        expect(importFn).toHaveBeenNthCalledWith(
          1,
          path.join('config', 'app', `app.${fileAConfigName}.config.js`),
        );
        expect(importFn).toHaveBeenNthCalledWith(
          2,
          path.join('config', 'app', `app.${fileBConfigName}.config.js`),
        );
      });

      it('should throw an error while trying to load a file', async () => {
        // Given
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(filepath: string): Promise<FileType> {
            throw new Error(`Something went wrong with ${filepath}`);
          }
        }
        const myRootFile = new MyRootFile();
        // When/Then
        const sut = new SimpleConfig({
          inject: {
            rootFile: myRootFile,
          },
        });
        expect(() => sut.loadFromFile()).rejects.toThrow(
          /could not load config from file/i,
        );
      });
    });

    describe('load', () => {
      it('should load a config that extends the default', async () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const extendedConfigName = 'extended';
        const extendedConfig = {
          oldestAge: 6,
          youngestAge: 2,
        };
        const expectedConfig = {
          ...defaultConfig,
          ...extendedConfig,
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const config = sut.getConfig();
        const configName = sut.get<string>('name');
        const updatedConfig = await sut.load(extendedConfigName, extendedConfig);
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(config).toEqual(defaultConfig);
        expect(configName).toBe('default');
        expect(updatedConfig).toEqual(expectedConfig);
        expect(newConfig).toEqual(expectedConfig);
        expect(newConfigName).toBe(extendedConfigName);
      });

      it('should load a config without switching', async () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const config = sut.getConfig();
        const configName = sut.get<string>('name');
        await sut.load(
          'extended',
          {
            oldestAge: 6,
            youngestAge: 2,
          },
          false,
        );
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(config).toEqual(defaultConfig);
        expect(configName).toBe('default');
        expect(newConfig).toEqual(defaultConfig);
        expect(newConfigName).toBe('default');
      });

      it('should load a config and enable config switch', async () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        const canSwitch = sut.canSwitchConfigs();
        await sut.load(
          'extended',
          {
            allowConfigSwitch: true,
            oldestAge: 6,
            youngestAge: 2,
          },
          false,
        );
        const canSwitchUpdated = sut.canSwitchConfigs();
        // Then
        expect(canSwitch).toBe(false);
        expect(canSwitchUpdated).toBe(true);
      });

      it('should load a config and ignore the config switch setting', async () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
          allowConfigSwitchSetting: false,
        });
        const canSwitch = sut.canSwitchConfigs();
        await sut.load(
          'extended',
          {
            allowConfigSwitch: true,
            oldestAge: 6,
            youngestAge: 2,
          },
          false,
        );
        const canSwitchUpdated = sut.canSwitchConfigs();
        // Then
        expect(canSwitch).toBe(false);
        expect(canSwitchUpdated).toBe(false);
      });

      it('should load a config that extends one from a file', async () => {
        // Given
        const fileConfig = {
          oldestNickname: 'Charo',
          youngestNickname: 'Pilar',
        };
        const fileConfigName = 'nicknames';
        const importFn = jest.fn();
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(filepath: string): Promise<FileType> {
            importFn(filepath);
            return Promise.resolve(fileConfig as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const extendedConfigName = 'extended';
        const extendedConfigProps = {
          oldestAge: 6,
          youngestAge: 2,
        };
        const extendedConfig = {
          extends: fileConfigName,
          ...extendedConfigProps,
        };
        const expectedConfig = {
          ...defaultConfig,
          ...fileConfig,
          ...extendedConfigProps,
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
          inject: {
            rootFile: myRootFile,
          },
        });
        const updatedConfig = await sut.load(extendedConfigName, extendedConfig);
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(updatedConfig).toEqual(expectedConfig);
        expect(newConfig).toEqual(expectedConfig);
        expect(newConfigName).toBe(extendedConfigName);
        expect(importFn).toHaveBeenCalledWith(
          path.join('config', 'app', `app.${fileConfigName}.config.js`),
        );
      });
    });

    describe('loadFromEnv', () => {
      it('should load a config named in an env var', async () => {
        // Given
        const fileConfig = {
          oldestNickname: 'Charo',
          youngestNickname: 'Pilar',
        };
        const fileConfigName = 'nicknames';
        const importFn = jest.fn();
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(filepath: string): Promise<FileType> {
            importFn(filepath);
            return Promise.resolve(fileConfig as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        const getEnvVarFn = jest.fn();
        class MyEnvUtils extends EnvUtils {
          override get(...args: Parameters<EnvUtils['get']>): string {
            getEnvVarFn(...args);
            return fileConfigName;
          }
        }
        const myEnvUtils = new MyEnvUtils();
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const expectedConfig = {
          ...defaultConfig,
          ...fileConfig,
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
          inject: {
            rootFile: myRootFile,
            envUtils: myEnvUtils,
          },
        });
        const updatedConfig = await sut.loadFromEnv();
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(updatedConfig).toEqual(expectedConfig);
        expect(newConfig).toEqual(expectedConfig);
        expect(newConfigName).toBe(fileConfigName);
        expect(importFn).toHaveBeenCalledWith(
          path.join('config', 'app', `app.${fileConfigName}.config.js`),
        );
        expect(getEnvVarFn).toHaveBeenCalledWith('APP_CONFIG');
      });

      it("shouldn't do anything if the env var is empty", async () => {
        // Given
        const getEnvVarFn = jest.fn();
        class MyEnvUtils extends EnvUtils {
          override get(...args: Parameters<EnvUtils['get']>): string {
            getEnvVarFn(...args);
            return '';
          }
        }
        const myEnvUtils = new MyEnvUtils();
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
          inject: {
            envUtils: myEnvUtils,
          },
        });
        const updatedConfig = await sut.loadFromEnv();
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(updatedConfig).toEqual(defaultConfig);
        expect(newConfig).toEqual(defaultConfig);
        expect(newConfigName).toBe('default');
        expect(getEnvVarFn).toHaveBeenCalledWith('APP_CONFIG');
      });
    });

    describe('switch', () => {
      it('should switch configs', async () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const newConfig = {
          oldestAge: 6,
          youngestAge: 2,
        };
        const newConfigName = 'ages';
        // When
        const sut = new SimpleConfig({
          defaultConfig,
          allowConfigSwitch: true,
        });
        sut.setConfig<typeof newConfig>(newConfig, newConfigName);
        const config = sut.getConfig();
        const switchedConfig = await sut.switch(newConfigName);
        const updatedConfig = sut.getConfig();
        // Then
        expect(config).toEqual(defaultConfig);
        expect(switchedConfig).toEqual(newConfig);
        expect(updatedConfig).toEqual(newConfig);
      });

      it('should load a config from a file and switch to it', async () => {
        // Given
        const fileConfig = {
          oldestNickname: 'Charo',
          youngestNickname: 'Pilar',
        };
        const fileConfigName = 'nicknames';
        const importFn = jest.fn();
        class MyRootFile extends RootFile {
          override import<FileType = unknown>(filepath: string): Promise<FileType> {
            importFn(filepath);
            return Promise.resolve(fileConfig as unknown as FileType);
          }
        }
        const myRootFile = new MyRootFile();
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const expectedConfig = {
          ...defaultConfig,
          ...fileConfig,
        };
        // When
        const sut = new SimpleConfig({
          defaultConfig,
          allowConfigSwitch: true,
          inject: {
            rootFile: myRootFile,
          },
        });
        const config = sut.getConfig();
        const updatedConfig = await sut.switch(fileConfigName);
        const newConfig = sut.getConfig();
        const newConfigName = sut.get<string>('name');
        // Then
        expect(config).toEqual(defaultConfig);
        expect(updatedConfig).toEqual(expectedConfig);
        expect(newConfig).toEqual(expectedConfig);
        expect(newConfigName).toBe(fileConfigName);
        expect(importFn).toHaveBeenCalledWith(
          path.join('config', 'app', `app.${fileConfigName}.config.js`),
        );
      });

      it('should throw an error when the feature is disabled', async () => {
        // Given/When/Then
        const sut = new SimpleConfig();
        expect(() => sut.switch('something')).rejects.toThrow(/the feature is disabled/i);
      });

      it('should allow switching when using the `force` parameter', async () => {
        // Given
        const defaultConfig = {
          oldest: 'Rosario',
          youngest: 'Pilar',
        };
        const newConfig = {
          oldestAge: 6,
          youngestAge: 2,
        };
        const newConfigName = 'ages';
        // When
        const sut = new SimpleConfig({
          defaultConfig,
        });
        sut.setConfig<typeof newConfig>(newConfig, newConfigName);
        const config = sut.getConfig();
        await sut.switch(newConfigName, true);
        const updatedConfig = sut.getConfig();
        // Then
        expect(config).toEqual(defaultConfig);
        expect(updatedConfig).toEqual(newConfig);
      });
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(simpleConfig()).toBeInstanceOf(SimpleConfig);
    });
  });

  describe('provider', () => {
    it('should include a Jimple provider', () => {
      // Given
      const setFn = jest.fn();
      class Container extends Jimple {
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container();
      // When
      simpleConfigProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [
        [string, () => SimpleConfig],
      ];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('config');
      expect(sut).toBeInstanceOf(SimpleConfig);
    });
  });
});
