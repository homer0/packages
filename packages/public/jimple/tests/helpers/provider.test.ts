import { provider } from '../../src/helpers';

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
});
