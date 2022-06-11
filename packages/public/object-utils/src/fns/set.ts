import { copy } from './copy';

export type SetOptions = {
  /**
   * The object where the property will be set.
   */
  target: unknown;
  /**
   * The path for the property.
   */
  path: string;
  /**
   * The value to set on the property.
   */
  value: unknown;
  /**
   * The delimiter that will separate the path components.
   */
  pathDelimiter?: string;
  /**
   * Whether or not to throw an error when the path is invalid. If this is `false`, the method
   * will silently fail and return `undefined`.
   */
  failWithError?: boolean;
};
/**
 * Sets a property on an object using a path. If the path doesn't exist, it will be
 * created.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 * @throws {Error} If one of the path components is for a non-object property and
 *                 `failWithError` is set to `true`.
 * @example
 *
 *   const target = {};
 *   console.log(set(target, 'some.prop.path', 'some-value'));
 *   // Will output { some: { prop: { path: 'some-value' } } }
 *
 */
export const set = <T = Record<string, unknown>>(options: SetOptions): T | undefined => {
  const { target, path, value, pathDelimiter = '.', failWithError = false } = options;
  const result = copy(target) as Record<string, unknown>;
  if (!path.includes(pathDelimiter)) {
    result[path] = value;
    return result as T;
  }

  const parts = path.split(pathDelimiter);
  const last = parts.pop();
  let currentElement = result;
  let currentPath = '';
  let foundInvalid = false;
  parts.forEach((part) => {
    currentPath += `${pathDelimiter}${part}`;
    const element = currentElement[part];
    const elementType = typeof element;
    if (elementType === 'undefined') {
      currentElement[part] = {};
      currentElement = currentElement[part] as Record<string, unknown>;
    } else if (elementType === 'object') {
      currentElement = currentElement[part] as Record<string, unknown>;
    } else {
      const errorPath = currentPath.substring(pathDelimiter.length);
      if (failWithError) {
        throw new Error(
          `There's already an element of type '${elementType}' on '${errorPath}'`,
        );
      } else {
        foundInvalid = true;
      }
    }
  });

  if (foundInvalid) return undefined;

  if (result && last) {
    currentElement[last] = value;
  }

  return result as T | undefined;
};
