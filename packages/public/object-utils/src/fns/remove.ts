import { copy } from './copy.js';
import { get } from './get.js';

export type RemoveOptions = {
  /**
   * The object from where the property will be removed.
   */
  target: unknown;
  /**
   * The path to the property.
   */
  path: string;
  /**
   * The delimiter that will separate the path components.
   */
  pathDelimiter?: string;
  /**
   * Whether or not to throw an error when the path is invalid. If this is `false`, the
   * function will silently fail.
   */
  failWithError?: boolean;
  /**
   * If this flag is `true` and after removing the property the parent object is empty,
   * it will remove it recursively until a non empty parent object is found.
   */
  cleanEmptyProperties?: boolean;
};
/**
 * Deletes a property of an object using a path.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 * @example
 *
 *   const target = {
 *     propOne: {
 *       propOneSub: 'Charito!',
 *     },
 *     propTwo: '!!!',
 *   };
 *   console.log(remove({ target, path: 'propOne.propOneSub' }));
 *   // Will output { propTwo: '!!!' }
 *
 */
function remove<T = unknown>(options: RemoveOptions): T | undefined;
function remove<T = unknown>(options: unknown, path: string): T | undefined;
function remove<T = unknown>(
  options: RemoveOptions | unknown,
  path?: string,
): T | undefined {
  let useOptions: RemoveOptions;
  if (typeof path === 'string') {
    useOptions = {
      target: options,
      path,
    };
  } else {
    useOptions = options as RemoveOptions;
  }

  const {
    target,
    path: usePath,
    pathDelimiter = '.',
    cleanEmptyProperties = true,
    failWithError = false,
  } = useOptions;

  const parts = usePath.split(pathDelimiter);
  const last = parts.pop()!;
  const result = copy(target) as Record<string, unknown>;
  if (!parts.length) {
    delete result[last];
    return result as T;
  }
  const parentPath = parts.join(pathDelimiter);
  const parentObj = get<Record<string, unknown>>({
    target: result,
    path: parentPath,
    pathDelimiter,
    failWithError,
  });

  if (typeof parentObj === 'undefined') {
    return undefined;
  }

  delete parentObj[last];
  if (cleanEmptyProperties && !Object.keys(parentObj).length) {
    return remove({
      target: result,
      path: parentPath,
      pathDelimiter,
      failWithError,
      cleanEmptyProperties,
    }) as T;
  }

  return result as T;
}

export { remove };
