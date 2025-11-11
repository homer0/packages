import { describe, expect, it } from 'vitest';
import * as path from 'path';
import { tsAsyncImport } from '@src/index.js';

describe('tsAsyncImport', () => {
  const here = __dirname;
  const fixturePath = ['.', path.join('fixtures', 'test.mjs')].join(path.sep);
  const fixtureAbsPath = path.join(here, fixturePath);
  const expectedModule = expect.objectContaining({
    default: 'hello from ESM',
  });

  it('should import an ESM file', async () => {
    // Given/When
    const result = await tsAsyncImport(fixtureAbsPath);
    // Then
    expect(result).toEqual(expectedModule);
  });

  it('should import an ESM file from a path context', async () => {
    // Given/When
    const result = await tsAsyncImport(fixturePath, here);
    // Then
    expect(result).toEqual(expectedModule);
  });
});
