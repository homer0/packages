import { copy } from './copy.js';

/**
 * List of paths that are forbidden to use on the `set` function, as they could lead to
 * security issues.
 *
 * @access protected
 */
const FORBIDDEN_PATHS = ['__proto__', 'prototype', 'constructor'];

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
 *   console.log(set({ target, path: 'some.prop.path', value: 'some-value' }));
 *   // Will output { some: { prop: { path: 'some-value' } } }
 *
 */
function set<T = Record<string, unknown>>(options: SetOptions): T | undefined;
function set<T = Record<string, unknown>>(
  options: SetOptions | unknown,
  path: string,
  value: unknown,
): T | undefined;
function set<T = Record<string, unknown>>(
  options: SetOptions | unknown,
  path?: string,
  value?: unknown,
): T | undefined {
  let useOptions: SetOptions;
  if (typeof path === 'string') {
    useOptions = {
      target: options,
      path,
      value,
    };
  } else {
    useOptions = options as SetOptions;
  }

  const {
    target,
    path: usePath,
    value: useValue,
    pathDelimiter = '.',
    failWithError = false,
  } = useOptions;
  const result = copy(target) as Record<string, unknown>;
  if (!usePath.includes(pathDelimiter)) {
    if (!usePath || FORBIDDEN_PATHS.includes(usePath.toLowerCase())) {
      return undefined;
    }

    result[usePath] = useValue;
    return result as T;
  }

  const parts = usePath.split(pathDelimiter);
  const isInvalid = parts.some(
    (part) => !part || FORBIDDEN_PATHS.includes(part.toLowerCase()),
  );

  if (isInvalid) {
    return undefined;
  }

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
    currentElement[last] = useValue;
  }

  return result as T | undefined;
}

export { set };
