import { Jimple } from '@src/jimple/index.js';
import { provider, createProvider } from '@src/helpers/index.js';

describe('provider', () => {
  it('should create a Jimple provider', () => {
    // Given
    const registerFn = jest.fn();
    // When
    const sut = provider(registerFn);
    // Then
    expect(sut).toStrictEqual({
      provider: true,
      register: registerFn,
    });
  });

  describe('createProvider', () => {
    it('should create a custom provider', () => {
      // Given
      class TestContainer extends Jimple {
        public test: boolean = true;
      }
      const container = new TestContainer();
      const testProvider = createProvider<TestContainer>();
      let found = false;
      const service = testProvider((c) => {
        found = c.test;
      });
      // When
      container.register(service);
      // Then
      expect(found).toBe(true);
    });
  });
});
