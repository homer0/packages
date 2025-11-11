import { vi, describe, expect, it } from 'vitest';
import { Jimple } from '@src/jimple/index.js';
import {
  provider,
  providerCreator,
  providers,
  createProviders,
} from '@src/helpers/index.js';

describe('providers', () => {
  it('should create a collection of providers', () => {
    // Given
    const container = new Jimple();
    const itemOneRegister = vi.fn();
    const itemOne = provider(itemOneRegister);
    const itemTwoRegister = vi.fn();
    const itemTwoCreator = vi.fn(() => itemTwoRegister);
    const itemTwo = providerCreator(itemTwoCreator);
    const items = { itemOne, itemTwo };
    // When
    const sut = providers(items);
    sut.register(container);
    // Then
    expect(sut.itemOne).toBe(itemOne);
    expect(sut.itemTwo).toBe(itemTwo);
    expect(itemOne.register).toHaveBeenCalledTimes(1);
    expect(itemOne.register).toHaveBeenCalledWith(container);
    expect(itemTwoCreator).toHaveBeenCalledTimes(1);
    expect(itemTwo.register).toHaveBeenCalledTimes(1);
    expect(itemTwo.register).toHaveBeenCalledWith(container);
  });

  describe('createProviders', () => {
    it('should create a collection of providers', () => {
      // Given
      class TestContainer extends Jimple {
        public test: boolean = true;
      }
      const container = new TestContainer();
      const testProviders = createProviders<TestContainer>();
      let found = false;
      const services = testProviders({
        itemOne: {
          provider: true,
          register: (c) => {
            found = c.test;
          },
        },
      });
      // When
      container.register(services);
      // Then
      expect(found).toBe(true);
    });
  });
});
