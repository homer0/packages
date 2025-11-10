import { Jimple, jimple } from '../../src/jimple/index.js';

describe('Jimple', () => {
  describe('try', () => {
    it('should correctly re-export Jimple', () => {
      // Given
      const resource = 'Batman';
      const name = 'Hero';
      const container = new Jimple();
      container.set(name, resource);
      // When
      const savedValue = container.try<string>(name);
      const invalidValue = container.try<string>('invalid');
      // Then
      expect(savedValue).toBe(resource);
      expect(invalidValue).toBeUndefined();
    });
  });

  describe('shorthand', () => {
    it('should create a container with a function', () => {
      // Given
      const resource = 'Batman';
      const name = 'Hero';
      // When
      const container = jimple({
        [name]: resource,
      });
      const value = container.get<string>(name);
      // Then
      expect(value).toBe(resource);
      expect(container).toBeInstanceOf(Jimple);
    });
  });
});
