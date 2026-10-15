import { CONFIG_DIR_NAME, getAgentDir } from '@earendil-works/pi-coding-agent';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { getAgentPath } from './agent-dir.js';

/** The Pi directory, in the home of the user. */
const PI_DIR = join(homedir(), CONFIG_DIR_NAME);
/** The agent directory. */
const AGENT_DIR = getAgentDir();
/** The directory where the profiles are. */
const PROFILES_DIR = getAgentPath('profiles');

/** The prefix of the paths relative to the Pi directory. */
const PI_PREFIX = 'pi:';
/** The prefix of the paths relative to the agent directory. */
const AGENT_PREFIX = 'agent:';
/** The pattern of the paths relative to a profile; it captures the name and the path. */
const PROFILE_PATTERN = /^profile:([^:]+):(.+)$/;

/**
 * Resolves a pi-style path reference to an absolute path.
 *
 * Supported formats:
 *
 * - `pi:<path>` — relative to the Pi directory (`~/.pi/`)
 * - `agent:<path>` — relative to the agent directory (`~/.pi/agent/`)
 * - `profile:<name>:<path>` — relative to a profile directory
 *   (`~/.pi/agent/profiles/<name>/`)
 * - Absolute path — used as-is
 * - Anything else — resolved relative to `baseDir`
 *
 * @example <caption>Relative to the agent directory</caption>
 *   resolvePiPath('agent:shared/base.yaml', '/project');
 *
 * @example <caption>Relative to the file that references it</caption>
 *   resolvePiPath('../base.yaml', '/project/.pi');
 *
 * @param value The path reference.
 * @param baseDir The directory to resolve the path from, when it doesn't have a prefix
 *   and it's not absolute.
 * @returns The absolute path.
 */
export const resolvePiPath = (value: string, baseDir: string): string => {
  if (value.startsWith(PI_PREFIX)) return join(PI_DIR, value.slice(PI_PREFIX.length));
  if (value.startsWith(AGENT_PREFIX))
    return join(AGENT_DIR, value.slice(AGENT_PREFIX.length));
  if (isAbsolute(value)) return value;

  const profileMatch = PROFILE_PATTERN.exec(value);
  if (profileMatch) {
    const [, profileName, profilePath] = profileMatch;
    return join(PROFILES_DIR, profileName!, profilePath!);
  }
  return join(baseDir, value);
};
