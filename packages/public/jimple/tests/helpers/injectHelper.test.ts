import { Jimple } from '../../src/jimple/index.js';
import { InjectHelper, injectHelper } from '../../src/helpers/index.js';

describe('InjectHelper', () => {
  describe('class', () => {
    it('should be initialized', () => {
      // Given/When
      const sut = new InjectHelper();
      // Then
      expect(sut).toBeInstanceOf(InjectHelper);
    });

    it('should return a dependency that already exists', () => {
      // Given
      type Dependencies = {
        dep: string;
      };
      const dependency = 'hello-world';
      // When
      const sut = new InjectHelper<Dependencies>();
      const result = sut.get({ dep: dependency }, 'dep', () => '');
      // Then
      expect(result).toBe(dependency);
    });

    it("should create a dependency that doesn't exists", () => {
      // Given
      type Dependencies = {
        dep: string;
      };
      const dependency = 'hello-world';
      // When
      const sut = new InjectHelper<Dependencies>();
      const result = sut.get({}, 'dep', () => dependency);
      // Then
      expect(result).toBe(dependency);
    });

    it('should resolve dependencies from the container', () => {
      // Given
      type Dependencies = {
        depOne: string;
        depTwo: number;
        depThree: string[];
      };
      const depOne = 'hello-world';
      const depTwo = 2509;
      const container = new Jimple({
        depOne,
        myDepTwo: depTwo,
      });
      // When
      const sut = new InjectHelper<Dependencies>();
      const result = sut.resolve(['depOne', 'depTwo', 'depThree'], container, {
        depTwo: 'myDepTwo',
      });
      // Then
      expect(result).toEqual({
        depOne,
        depTwo,
      });
    });
  });

  describe('shorthand', () => {
    it('should have a shorthand function', () => {
      // Given/When/Then
      expect(injectHelper()).toBeInstanceOf(InjectHelper);
    });
  });
});
