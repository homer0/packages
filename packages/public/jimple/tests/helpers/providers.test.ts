import { provider, providerCreator, providers } from '../../src/helpers';
import { Jimple } from '../../src/jimple';

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
});
