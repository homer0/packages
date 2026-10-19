import { Jimple } from '@src/index.js';
import type { Jimple as OriginalJimple } from '@src/original/index.js';
import { describe, expect, it, vi } from 'vitest';

describe('Jimple original integration', () => {
  it('initializes from plain objects and ignores non-plain values', () => {
    const prototypeLessValues = Object.assign(Object.create(null), { hero: 'Batman' });

    expect(new Jimple({ sidekick: 'Robin' }).get('sidekick')).toBe('Robin');
    expect(new Jimple(prototypeLessValues).get('hero')).toBe('Batman');
    expect(new Jimple(['ignored'] as never).keys()).toEqual([]);
  });

  it('stores parameters and exposes their raw values and keys', () => {
    const container = new Jimple();
    const value = { name: 'Batman' };

    container.set('hero', value);

    expect(container.has('hero')).toBe(true);
    expect(container.has('missing')).toBe(false);
    expect(container.keys()).toEqual(['hero']);
    expect(container.get('hero')).toBe(value);
    expect(container.raw('hero')).toBe(value);
  });

  it('throws for missing values', () => {
    const container = new Jimple();

    expect(() => container.get('missing')).toThrow(
      'Identifier "missing" is not defined.',
    );
    expect(() => container.raw('missing')).toThrow(
      'Identifier "missing" is not defined.',
    );
  });

  it('builds services once and returns their cached instances', () => {
    const container = new Jimple();
    const build = vi.fn(() => ({ name: 'Batman' }));
    container.set('hero', build);

    expect(container.get('hero')).toBe(container.get('hero'));
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('does not cache services marked as factories', () => {
    const container = new Jimple();
    const build = vi.fn(() => ({}));
    container.set('hero', container.factory(build));

    expect(container.get('hero')).not.toBe(container.get('hero'));
    expect(build).toHaveBeenCalledTimes(2);
  });

  it('returns protected functions without invoking them', () => {
    const container = new Jimple();
    const callback = vi.fn(() => 'Batman');
    container.set('callback', container.protect(callback));

    expect(container.get('callback')).toBe(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it('rejects non-function factory and protected definitions', () => {
    const container = new Jimple();

    expect(() => container.factory({} as never)).toThrow(
      'Service definition is not a Closure or invokable object',
    );
    expect(() => container.protect({} as never)).toThrow(
      'Service definition is not a Closure or invokable object',
    );
  });

  it('extends services and preserves factory behavior', () => {
    const container = new Jimple();
    const build = vi.fn(() => 1);
    container.set('hero', container.factory(build));
    container.extend('hero', (original, app) => (original as number) + app.keys().length);

    expect(container.get('hero')).toBe(2);
    expect(container.get('hero')).toBe(2);
    expect(build).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid service extensions', () => {
    const container = new Jimple();
    container.set('value', 'Batman');
    container.set(
      'protected',
      container.protect(() => 'Robin'),
    );
    container.set('service', () => 'Alfred');

    expect(() => container.extend('missing', () => undefined)).toThrow(
      'Identifier "missing" is not defined.',
    );
    expect(() => container.extend('value', () => undefined)).toThrow(
      "Identifier 'value' does not contain a service definition",
    );
    expect(() => container.extend('protected', () => undefined)).toThrow(
      "Identifier 'protected' does not contain a service definition",
    );
    expect(() => container.extend('service', {} as never)).toThrow(
      "The 'new' service definition for 'service' is not a invokable object.",
    );
  });

  it('registers providers created through the public API', () => {
    const container = new Jimple();
    const register = vi.fn((app: OriginalJimple) => app.set('hero', 'Batman'));

    container.register(Jimple.provider(register));

    expect(register).toHaveBeenCalledWith(container);
    expect(container.get('hero')).toBe('Batman');
  });
});
