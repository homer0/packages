import { CONFIG_DIR_NAME, getAgentDir } from '@earendil-works/pi-coding-agent';
import { resolvePiPath } from '@homer0/pi-config';
import { createJiti } from 'jiti';
import { stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, sep } from 'node:path';
import { SecretsConfigError } from '../../utils.js';
import type { CustomSecretProviderClass } from './types.js';

/** The methods of the class that are not required, but have to be functions if present. */
const OPTIONAL_METHODS = ['getSecrets', 'close'] as const;

/** The classes that were loaded, or are being loaded, by the path of their file. */
const loadedClasses = new Map<string, Promise<CustomSecretProviderClass>>();

/**
 * Gets the message of a thrown value.
 *
 * @param error The thrown value.
 * @returns The message of the error, or the value as a string if it's not an error.
 */
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Checks that a path is inside a directory, comparing the normalized paths.
 *
 * @param baseDir The directory.
 * @param path The absolute path.
 * @returns Whether the path is inside the directory.
 */
const isInside = (baseDir: string, path: string): boolean => {
  const fromBase = relative(baseDir, path);
  return fromBase !== '..' && !fromBase.startsWith(`..${sep}`) && !isAbsolute(fromBase);
};

/**
 * Resolves the file of a custom provider. It has to start with a Pi prefix (`pi:`,
 * `agent:` or `profile:<name>:`) and the result has to stay inside the Pi directory or
 * the agent directory, so a config that comes from a project can't point to code outside
 * of the Pi installation, not even with `..`.
 *
 * @param file The `file` of the provider.
 * @returns The absolute path.
 * @throws {SecretsConfigError} When the file has no Pi prefix, or the path is outside of
 *   the Pi directory and the agent directory.
 */
const resolveFilePath = (file: string): string => {
  let path: string;
  try {
    path = resolvePiPath(file, { prefixedOnly: true });
  } catch (error) {
    throw new SecretsConfigError(
      `The file of a custom provider is not valid. ${getErrorMessage(error)}`,
    );
  }

  const allowedDirs = [join(homedir(), CONFIG_DIR_NAME), getAgentDir()];
  if (!allowedDirs.some((baseDir) => isInside(baseDir, path))) {
    throw new SecretsConfigError(
      `The file of a custom provider has to be inside the Pi directory or the agent directory, but "${file}" resolves to "${path}".`,
    );
  }

  return path;
};

/**
 * Checks that the default export of a file is a class a custom provider can use. It's
 * only checked in the prototype, so methods that are properties of the instance are not
 * found.
 *
 * @param value The default export of the file.
 * @param path The path of the file, for the error messages.
 * @throws {SecretsConfigError} When it's not a class, it doesn't have `getSecret`, or
 *   `getSecrets` or `close` are there but are not functions.
 */
function assertCustomClass(
  value: unknown,
  path: string,
): asserts value is CustomSecretProviderClass {
  if (typeof value !== 'function') {
    throw new SecretsConfigError(
      `The custom provider file ${path} has to export a class as its default export.`,
    );
  }

  const prototype: unknown = Reflect.get(value, 'prototype');
  if (
    typeof prototype !== 'object' ||
    prototype === null ||
    typeof Reflect.get(prototype, 'getSecret') !== 'function'
  ) {
    throw new SecretsConfigError(
      `The class of the custom provider file ${path} needs a getSecret method, defined in the class and not as a property of the instance.`,
    );
  }

  for (const method of OPTIONAL_METHODS) {
    const implementation: unknown = Reflect.get(prototype, method);
    if (typeof implementation !== 'undefined' && typeof implementation !== 'function') {
      throw new SecretsConfigError(
        `The ${method} of the class of the custom provider file ${path} has to be a method.`,
      );
    }
  }
}

/**
 * Imports a file with jiti, so it can be written in TypeScript, and validates its default
 * export.
 *
 * @param path The absolute path of the file.
 * @returns The class.
 * @throws {SecretsConfigError} When the file doesn't exist, can't be imported, or its
 *   default export is not a valid class.
 */
const importClass = async (path: string): Promise<CustomSecretProviderClass> => {
  const isFile = await stat(path).then(
    (stats) => stats.isFile(),
    () => false,
  );
  if (!isFile) {
    throw new SecretsConfigError(`The custom provider file was not found: ${path}`);
  }

  let value: unknown;
  try {
    // The classes are kept in `loadedClasses`, so jiti doesn't have to keep the modules:
    // without it, a file that failed and was fixed would be loaded again as it was. The
    // transpile cache on disk (`fsCache`) is left on, with its default location: it's what
    // makes loading a TypeScript file fast in a fresh process, like the one of a skill.
    const jiti = createJiti(import.meta.url, { moduleCache: false });
    ({ default: value } = await jiti.import<{ default?: unknown }>(path));
  } catch (error) {
    throw new SecretsConfigError(
      `The custom provider file ${path} could not be loaded: ${getErrorMessage(error)}`,
    );
  }

  assertCustomClass(value, path);
  return value;
};

/**
 * Loads the class of a custom provider from its file. The file is imported and validated
 * once, and the class is kept by the path of the file, even for calls that come while it
 * is being loaded. A load that fails is not kept, so the next call tries again. The file
 * is not read again if it changes.
 *
 * @param file The `file` of the provider.
 * @returns The class.
 * @throws {SecretsConfigError} When the path is not valid or is outside of the Pi
 *   directory and the agent directory, or when the file doesn't exist, can't be imported,
 *   or its default export is not a valid class.
 */
export const loadCustomSecretProviderClass = async (
  file: string,
): Promise<CustomSecretProviderClass> => {
  const path = resolveFilePath(file);
  const existing = loadedClasses.get(path);
  if (existing) return existing;

  const loading = importClass(path);
  loadedClasses.set(path, loading);
  // The error still reaches whoever awaits `loading`: this only makes the next call try
  // again, instead of getting the same failure.
  loading.catch(() => {
    if (loadedClasses.get(path) === loading) loadedClasses.delete(path);
  });

  return loading;
};
