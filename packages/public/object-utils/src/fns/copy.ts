import { merge } from './merge.js';

/**
 * Creates a deep copy of a given object.
 *
 * @param target  The object to copy.
 * @template T  The type of the input object, which will be the same as the one
 *              returned.
 */
export const copy = <T>(target: T): T => merge(target);
