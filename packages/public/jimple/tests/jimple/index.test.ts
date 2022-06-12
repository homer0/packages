jest.unmock('../../src/jimple');

import { Jimple } from '../../src/jimple';

describe('Jimple', () => {
  it('should correctly re-export Jimple', () => {
    const resource = 'Batman';
    const name = 'Hero';
    const container = new Jimple();
    container.set(name, resource);
    const value = container.get<string>(name);
    expect(value).toBe(resource);
  });
});
