import { vi, describe, expect, it, type Mock } from 'vitest';
import { Jimple } from '@src/jimple/index.js';
import { providerCreator, createProviderCreator } from '@src/helpers/index.js';

describe('providerCreator', () => {
  it('should create a provider creator for Jimple', () => {
    // Given
    const finalResource = 'Batman';
    const registerFn = vi.fn(() => finalResource);
    const creatorFn = vi.fn(() => registerFn);
    const container = new Jimple();
    // When
    const sut = providerCreator(creatorFn);
    const result = sut.register(container);
    // Then
    expect(result).toBe(finalResource);
    expect(creatorFn).toHaveBeenCalledTimes(1);
  });

  it('should create a configurable provider creator for Jimple', () => {
    // Given
    const finalResource = 'Batman';
    const prefixArg = 'prefix:';
    type RegisterFn = Mock<() => string>;
    let registerFn: RegisterFn;
    const creatorFn = vi.fn((arg0: string = '') => {
      registerFn = vi.fn(() => `${arg0}${finalResource}`);
      return registerFn;
    });
    const container = new Jimple();
    // When
    const sut = providerCreator(creatorFn);
    const configuredResult = sut(prefixArg).register(container);
    const result = sut.register(container);
    // Then
    expect(configuredResult).toBe(`${prefixArg}${finalResource}`);
    expect(result).toBe(finalResource);
    expect(creatorFn).toHaveBeenCalledTimes(2);
    expect(creatorFn).toHaveBeenNthCalledWith(1, prefixArg);
    expect(creatorFn).toHaveBeenNthCalledWith(2);
  });

  describe('createProviderCreator', () => {
    it('should create a custom provider creator', () => {
      // Given
      class TestContainer extends Jimple {
        public test: boolean = true;
      }
      const container = new TestContainer();
      const testProviderCreator = createProviderCreator<TestContainer>();
      let found = false;
      const service = testProviderCreator(() => (c) => {
        found = c.test;
      });
      // When
      container.register(service);
      // Then
      expect(found).toBe(true);
    });
  });
});
