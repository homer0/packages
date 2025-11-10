import { Jimple } from '@src/jimplemod/index.js';

describe('Jimple', () => {
  it('should correctly re-export Jimple', () => {
    // Given
    const resource = 'Batman';
    const name = 'Hero';
    const container = new Jimple();
    // When
    container.set(name, resource);
    const value = container.get<string>(name);
    // Then
    expect(value).toBe(resource);
  });
});
