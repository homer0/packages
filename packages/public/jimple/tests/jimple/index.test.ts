import { Jimple } from '../../src/jimple';

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
});
