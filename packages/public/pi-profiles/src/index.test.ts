import { describe, expect, it } from 'vitest';
import * as api from './index.js';

describe('public API', () => {
  it('exposes the profile resolution and the config schema', () => {
    expect(Object.keys(api).toSorted()).toEqual([
      'profilesConfigSchema',
      'resolveEnabledProfiles',
    ]);
  });
});
