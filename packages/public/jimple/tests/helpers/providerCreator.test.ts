import { Jimple } from '../../src/jimple';
import { providerCreator, createProviderCreator } from '../../src/helpers';

describe('providerCreator', () => {
  it('should create a provider creator for Jimple', () => {
    // Given
    const finalResource = 'Batman';
    const registerFn = jest.fn(() => finalResource);
    const creatorFn = jest.fn(() => registerFn);
    // When
    const sut = providerCreator(creatorFn);
    const result = sut.register();
    // Then
    expect(result).toBe(finalResource);
    expect(creatorFn).toHaveBeenCalledTimes(1);
  });

  it('should create a configurable provider creator for Jimple', () => {
    // Given
    const finalResource = 'Batman';
    const prefixArg = 'prefix:';
    type RegisterFn = jest.Mock<string, []>;
    let registerFn: RegisterFn;
    const creatorFn = jest.fn((arg0: string = '') => {
      registerFn = jest.fn(() => `${arg0}${finalResource}`);
      return registerFn;
    });
    // When
    const sut = providerCreator(creatorFn);
    const configuredResult = sut(prefixArg).register();
    const result = sut.register();
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
