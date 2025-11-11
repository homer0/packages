/* eslint-disable dot-notation, no-process-env */
import { vi, describe, expect, it, beforeEach } from 'vitest';
import { Jimple } from '@homer0/jimple';
import { EnvUtils, envUtilsProvider, envUtils } from '@src/index.js';

const originalEnv = process.env;

describe('EnvUtils', () => {
  describe('class', () => {
    beforeEach(() => {
      process.env = originalEnv;
    });

    it('should load the NODE_ENV value and set the production flag correctly', () => {
      // Given
      const env = 'production';
      process.env['NODE_ENV'] = env;
      // When
      const sut = new EnvUtils();
      // Then
      expect(sut.env).toBe(env);
      expect(sut.production).toBe(true);
      expect(sut.development).toBe(false);
    });

    it('should fallback to `development` if NODE_ENV is not production', () => {
      // Given
      delete process.env['NODE_ENV'];
      // When
      const sut = new EnvUtils();
      // Then
      expect(sut.env).toBe('development');
      expect(sut.production).toBe(false);
      expect(sut.development).toBe(true);
    });

    it('should allow you to access environment variables', () => {
      // Given
      const varName = 'Bruce';
      const varValue = 'Wayne';
      process.env[varName] = varValue;
      // When
      const sut = new EnvUtils();
      const result = sut.get(varName);
      // Then
      expect(result).toBe(varValue);
    });

    it("should fallback to an empty string if a specified variable doesn't exist", () => {
      // Given/When
      const sut = new EnvUtils();
      const result = sut.get('Charito');
      // Then
      expect(result).toBe('');
    });

    it("should throw an error if a required variable doesn't exist", () => {
      // Given/When/Then
      const sut = new EnvUtils();
      expect(() => sut.get('Charito', '', true)).toThrow(
        /The following environment variable is missing/i,
      );
    });

    it('should set the value for an environment variable', () => {
      // Given
      const varName = 'BATMAN_IDENTITY';
      const varValue = 'Bruce Wayne';
      delete process.env[varName];
      // When
      const sut = new EnvUtils();
      const result = sut.set(varName, varValue);
      const saved = sut.get(varName);
      // Then
      expect(result).toBe(true);
      expect(saved).toBe(varValue);
    });

    it("shouldn't overwrite an existing environment variable", () => {
      // Given
      const varName = 'ROBIN_IDENTITY';
      const varOriginalValue = 'Tim Drake';
      const varValue = 'Damian Wayne';
      // When
      process.env[varName] = varOriginalValue;
      const sut = new EnvUtils();
      const result = sut.set(varName, varValue);
      const saved = sut.get(varName);
      // Then
      expect(result).toBe(false);
      expect(saved).toBe(varOriginalValue);
    });

    it('should overwrite an existing environment variable', () => {
      // Given
      const varName = 'ROBIN_IDENTITY';
      const varOriginalValue = 'Tim Drake';
      const varValue = 'Damian Wayne';
      // When
      process.env[varName] = varOriginalValue;
      const sut = new EnvUtils();
      const result = sut.set(varName, varValue, true);
      const saved = sut.get(varName);
      // Then
      expect(result).toBe(true);
      expect(saved).toBe(varValue);
    });
  });

  describe('shorthand', () => {
    beforeEach(() => {});

    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(envUtils()).toBeInstanceOf(EnvUtils);
    });
  });

  describe('provider', () => {
    beforeEach(() => {
      process.env = originalEnv;
    });

    it('should include a Jimple provider', () => {
      // Given
      const setFn = vi.fn();
      class Container extends Jimple {
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container();
      // When
      envUtilsProvider.register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [[string, () => EnvUtils]];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe('envUtils');
      expect(sut).toBeInstanceOf(EnvUtils);
    });

    it('should allow custom options on its service provider', () => {
      // Given
      const setFn = vi.fn();
      class Container extends Jimple {
        override set(...args: Parameters<Jimple['set']>) {
          setFn(...args);
          super.set(...args);
        }
      }
      const container = new Container();
      const options = {
        serviceName: 'myEnvUtils',
      };
      // When
      envUtilsProvider(options).register(container);
      const [[serviceName, serviceFn]] = setFn.mock.calls as [[string, () => EnvUtils]];
      const sut = serviceFn();
      // Then
      expect(serviceName).toBe(options.serviceName);
      expect(sut).toBeInstanceOf(EnvUtils);
    });
  });
});
