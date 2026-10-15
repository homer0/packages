import { getAgentDir } from '@earendil-works/pi-coding-agent';
import { join } from 'node:path';

/**
 * Resolves a path relative to the Pi agent directory.
 *
 * @param segments The segments of the path, relative to the agent directory.
 * @returns The absolute path.
 */
export const getAgentPath = (...segments: string[]): string =>
  join(getAgentDir(), ...segments);
