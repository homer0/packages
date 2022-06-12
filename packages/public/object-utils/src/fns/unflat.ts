import { set } from './set';

export type UnflatOptions = {
  /**
   * The object to transform.
   */
  target: unknown;
  /**
   * The delimiter that will separate the path components.
   */
  pathDelimiter?: string;
};
/**
 * This method does the exact opposite from `flat`: It takes an already flatten object and
 * restores it structure.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 * @example
 *
 *   const target = {
 *     'propOne.propOneSub': 'Charito!',
 *     propTwo: '!!!',
 *   };
 *   console.log(unflat({ target }));
 *   // Will output { propOne: { propOneSub: 'Charito!' }, 'propTwo': '!!!' }
 *
 */
export const unflat = <T = Record<string, unknown>>(options: UnflatOptions): T => {
  const { target, pathDelimiter = '.' } = options;
  const useTarget = target as Record<string, unknown>;
  return Object.keys(useTarget).reduce<Record<string, unknown>>(
    (current, key) =>
      set({ target: current, path: key, value: useTarget[key], pathDelimiter })!,
    {},
  ) as T;
};
