import { CONFIG_DIR_NAME, getAgentDir } from '@earendil-works/pi-coding-agent';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getAgentPath } from './agent-dir.js';
import { resolvePiPath } from './path.js';

describe('path utils', () => {
  describe('getAgentPath', () => {
    it('resolves segments relative to the agent directory', () => {
      expect(getAgentPath('profiles', 'work')).toBe(
        join(getAgentDir(), 'profiles', 'work'),
      );
    });

    it('returns the agent directory without segments', () => {
      expect(getAgentPath()).toBe(getAgentDir());
    });
  });

  describe('resolvePiPath', () => {
    const baseDir = '/base/dir';

    it('resolves `pi:` paths relative to the Pi directory', () => {
      expect(resolvePiPath('pi:shared/base.yaml', baseDir)).toBe(
        join(homedir(), CONFIG_DIR_NAME, 'shared/base.yaml'),
      );
    });

    it('resolves `agent:` paths relative to the agent directory', () => {
      expect(resolvePiPath('agent:shared/base.yaml', baseDir)).toBe(
        join(getAgentDir(), 'shared/base.yaml'),
      );
    });

    it('resolves `profile:<name>:<path>` paths relative to the profile directory', () => {
      expect(resolvePiPath('profile:work:base.yaml', baseDir)).toBe(
        join(getAgentDir(), 'profiles', 'work', 'base.yaml'),
      );
    });

    it('uses absolute paths as they are', () => {
      expect(resolvePiPath('/shared/base.yaml', baseDir)).toBe('/shared/base.yaml');
    });

    it.each([
      ['a relative path', '../base.yaml', '/base/base.yaml'],
      ['a dot-relative path', './base.yaml', '/base/dir/base.yaml'],
      ['a bare file name', 'base.yaml', '/base/dir/base.yaml'],
      ['a profile reference without a path', 'profile:work', '/base/dir/profile:work'],
    ])('resolves %s from the base directory', (_label, value, expected) => {
      expect(resolvePiPath(value, baseDir)).toBe(expected);
    });
  });
});
