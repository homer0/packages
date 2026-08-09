import { merge } from './merge.js';

/**
 * Creates a deep copy of a given object.
 *
 * @template T The type of the input object, which will be the same as the one returned.
 * @param target The object to copy.
 */
export const copy = <T>(target: T): T => merge(target);
