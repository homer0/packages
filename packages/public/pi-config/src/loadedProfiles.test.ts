/* eslint-disable n/no-process-env -- The tests check what is published in the environment. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getLoadedProfiles,
  LOADED_PROFILES_ENV,
  setLoadedProfiles,
} from './loadedProfiles.js';

/** Forgets what this process was told, as if it had just started. */
const resetLoadedProfiles = (): void => {
  Reflect.deleteProperty(globalThis, '__piConfigLoadedProfiles');
  Reflect.deleteProperty(process.env, LOADED_PROFILES_ENV);
};

describe('loaded profiles', () => {
  beforeEach(() => {
    resetLoadedProfiles();
  });

  afterEach(() => {
    resetLoadedProfiles();
  });

  it('has no profiles by default', () => {
    expect(getLoadedProfiles()).toEqual([]);
  });

  it('returns the profiles in the order they were set', () => {
    setLoadedProfiles(['b', 'a']);

    expect(getLoadedProfiles()).toEqual(['b', 'a']);
  });

  it('replaces the previous profiles', () => {
    setLoadedProfiles(['a']);
    setLoadedProfiles(['b']);

    expect(getLoadedProfiles()).toEqual(['b']);
  });

  it('returns a copy, so changing it does not change what is stored', () => {
    setLoadedProfiles(['a']);

    getLoadedProfiles().push('b');

    expect(getLoadedProfiles()).toEqual(['a']);
  });

  it('keeps its own copy of the list it is given', () => {
    const names = ['a'];
    setLoadedProfiles(names);

    names.push('b');

    expect(getLoadedProfiles()).toEqual(['a']);
  });

  it('shares the profiles through globalThis, whichever copy of the module sets them', () => {
    setLoadedProfiles(['a']);

    expect(
      (globalThis as typeof globalThis & { __piConfigLoadedProfiles?: string[] })
        .__piConfigLoadedProfiles,
    ).toEqual(['a']);
  });

  describe('environment', () => {
    it('publishes the profiles for the processes Pi starts', () => {
      setLoadedProfiles(['b', 'a']);

      expect(process.env[LOADED_PROFILES_ENV]).toBe('["b","a"]');
    });

    it('publishes an empty list too, so a previous one is not left behind', () => {
      setLoadedProfiles(['a']);
      setLoadedProfiles([]);

      expect(process.env[LOADED_PROFILES_ENV]).toBe('[]');
    });

    it('reads the profiles from it in a process that was not told about them', () => {
      process.env[LOADED_PROFILES_ENV] = '["b","a"]';

      expect(getLoadedProfiles()).toEqual(['b', 'a']);
    });

    it('prefers what the process was told over the variable', () => {
      process.env[LOADED_PROFILES_ENV] = '["env"]';
      setLoadedProfiles(['told']);
      process.env[LOADED_PROFILES_ENV] = '["env"]';

      expect(getLoadedProfiles()).toEqual(['told']);
    });

    it('respects an empty list the process was told about', () => {
      setLoadedProfiles([]);
      process.env[LOADED_PROFILES_ENV] = '["env"]';

      expect(getLoadedProfiles()).toEqual([]);
    });

    it('drops the names that could point outside the profiles directory', () => {
      process.env[LOADED_PROFILES_ENV] = JSON.stringify([
        'ok',
        '',
        '.',
        '..',
        '../x',
        'a/b',
        'a\\b',
      ]);

      expect(getLoadedProfiles()).toEqual(['ok']);
    });

    it.each([['not json'], ['{"a":1}'], ['"a"'], ['[1]'], ['null'], ['']])(
      'ignores a value that is not a JSON array of names: %j',
      (value) => {
        process.env[LOADED_PROFILES_ENV] = value;

        expect(getLoadedProfiles()).toEqual([]);
      },
    );
  });
});
