import extend from 'extend';

/**
 * This method makes a deep merge of a list of objects into a new one. The method also
 * supports arrays: if the first element is an array, it will be merged into an array,
 * otherwise, it will be an object.
 *
 * @example
 *   const objA = { a: 'first' };
 *   const objB = { b: 'second' };
 *   console.log(merge(objA, objB));
 *   // Will output { a: 'first', b: 'second' }
 *
 * @example
 *   const arrA = [{ a: 'first' }];
 *   const arrB = [{ b: 'second' }];
 *   console.log(merge(objA, objB));
 *   // Will output [{ a: 'first', b: 'second' }]
 *
 * @template T The type of the merged object that will be returned.
 * @param targets The list of objects to merge.
 */
export const merge = <T = unknown>(...targets: unknown[]): T => {
  const [firstTarget] = targets;
  const base = Array.isArray(firstTarget) ? [] : {};
  return extend(true, base, ...targets) as T;
};
