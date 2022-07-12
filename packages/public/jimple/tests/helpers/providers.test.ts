import { Jimple } from '../../src/jimple';
import { provider, providerCreator, providers, createProviders } from '../../src/helpers';

describe('providers', () => {
  it('should create a collection of providers', () => {
    // Given
    const container = new Jimple();
    const itemOneRegister = jest.fn();
    const itemOne = provider(itemOneRegister);
    const itemTwoRegister = jest.fn();
    const itemTwoCreator = jest.fn(() => itemTwoRegister);
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
