import { copy } from './copy';
import { merge } from './merge';

/**
 * Checks whether a key for an array or an Object should be flattened.
 *
 * @param key    The key to check inside its parent.
 * @param value  The value of the key.
 */
export type ShouldFlattenFn = (key: string, value: unknown) => boolean;

export type FlatOptions = {
  /**
   * The object to transform.
   */
  target: unknown;
  /**
   * A custom prefix to be added before the name of the properties. This can be used on
   * custom cases and it's also used when the method calls itself in order to flatten a
   * sub object.
   */
  prefix?: string;
  /**
   * The delimiter that will separate the path components.
   */
  pathDelimiter?: string;
  /**
   * A custom function that can be used in order to tell the function whether an Object or
   * an Array property should be flatten or not.
   */
  shouldFlatten?: ShouldFlattenFn;
};
/**
 * Flattens an object properties into a single level dictionary.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 * @example
 *
 * const target = {
 * propOne: {
 * propOneSub: 'Charito!',
 * },
 * propTwo: '!!!',
 * };
 * console.log(flat(target);
 * // Will output { 'propOne.propOneSub': 'Charito!', propTwo: '!!!' }
 *
 */
export const flat = <T = Record<string, unknown>>(options: FlatOptions): T => {
  const { target, shouldFlatten, pathDelimiter = '.', prefix = '' } = options;
  const useTarget = target as Record<string, unknown>;
  let result: Record<string, unknown> = {};
  const namePrefix = prefix ? `${prefix}${pathDelimiter}` : '';
  Object.keys(useTarget).forEach((key) => {
    const name = `${namePrefix}${key}`;
    const value = useTarget[key] as unknown;
    const valueType = typeof value;
    const isObject = valueType === 'object' && value !== null;
    if (isObject && (!shouldFlatten || shouldFlatten(key, value))) {
      result = merge(
        result,
        flat({ target: value, pathDelimiter, prefix: name, shouldFlatten }),
      );
    } else {
      result[name] = isObject ? copy(value) : value;
    }
  });

  return result as T;
};
