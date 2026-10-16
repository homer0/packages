import { fileURLToPath } from 'node:url';

/**
 * Resolves the path of a fixture. The code under test imports the fixtures by path, so
 * the tests need the paths, not the modules.
 *
 * @param name The file name of the fixture.
 * @returns The absolute path of the fixture.
 */
const fixturePath = (name: string): string =>
  fileURLToPath(new URL(`./${name}`, import.meta.url));

/** A factory that only records that it was called. */
export const FACTORY_FIXTURE = fixturePath('factory.ts');
/** A factory that registers a `session_start` handler. */
export const FACTORY_SESSION_START_FIXTURE = fixturePath('factory-session-start.ts');
/** A factory that registers a handler for an event that is not `session_start`. */
export const FACTORY_OTHER_EVENT_FIXTURE = fixturePath('factory-other-event.ts');
/** An extension module without a factory. */
export const NO_FACTORY_FIXTURE = fixturePath('no-factory.ts');
/** A path in the fixtures folder that doesn't exist. */
export const MISSING_FIXTURE = fixturePath('does-not-exist.ts');
