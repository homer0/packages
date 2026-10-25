import { describe, expect, it } from 'vitest';
import * as api from './index.js';

describe('public API', () => {
  it('exposes the client functions', () => {
    expect(Object.keys(api).toSorted()).toEqual([
      'flushCache',
      'getCached',
      'getDaemonStatus',
      'getEntry',
      'removeEntry',
      'restartDaemon',
      'setEntry',
      'stopDaemon',
    ]);
  });
});
