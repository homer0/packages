export type GetOptions = {
  /**
   * The object from where the property will be read.
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
   * Whether or not to throw an error when the path is invalid. If this is `false`,
   *  the method will silently fail and return `undefined`.
   */
  failWithError?: boolean;
};

/**
 * Returns the value of an object property using a path.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 * @throws {Error} If the path is invalid and `failWithError` is set to `true`.
 * @example
 *
 *   const obj = {
 *     propOne: {
 *       propOneSub: 'Charito!',
 *     },
 *     propTwo: '!!!',
 *   };
 *   console.log(get({ target: obj, path: 'propOne.propOneSub' }));
 *   // Will output 'Charito!'
 *
 */
function get<T>(options: GetOptions): T | undefined;
function get<T>(options: unknown, path: string): T | undefined;
function get<T>(options: GetOptions | unknown, path?: string): T | undefined {
  let useOptions: GetOptions;
  if (typeof path === 'string') {
    useOptions = {
      target: options,
      path,
    };
  } else {
    useOptions = options as GetOptions;
  }

  const {
    target,
    path: usePath,
    pathDelimiter = '.',
    failWithError = false,
  } = useOptions;
  const useTarget = target as Record<string, unknown>;
  const parts = usePath.split(pathDelimiter);
  const first = parts.shift()!;
  let currentElement = useTarget[first] as Record<string, unknown>;
  if (typeof currentElement === 'undefined') {
    if (failWithError) {
      throw new Error(`There's nothing on '${usePath}'`);
    }

    return undefined;
  }

  if (!parts.length) {
    return currentElement as T;
  }

  let currentPath = first;
  parts.some((currentPart) => {
    let breakLoop = false;
    currentPath += `${pathDelimiter}${currentPart}`;
    currentElement = currentElement[currentPart] as Record<string, unknown>;
    if (typeof currentElement === 'undefined') {
      if (failWithError) {
        throw new Error(`There's nothing on '${currentPath}'`);
      } else {
        breakLoop = true;
      }
    }

    return breakLoop;
  });

  return currentElement as T;
}

export { get };
