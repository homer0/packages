export type FormatKeysReplaceFn = (substring: string, ...args: string[]) => string;

export type FormatKeysOptions = {
  /**
   * The object to transform.
   */
  target: unknown;
  /**
   * A regular expression to match the keys to transform.
   */
  search: RegExp;
  /**
   * The callback that will be used to replace the matched substring. Think of `search` and
   * `replace` as the parameters of `String.replace`.
   */
  replace: FormatKeysReplaceFn;
  /**
   * A list of keys or paths where the transformation will be made. If not specified, the
   * function will use all the keys from the object.
   */
  include?: string[];
  /**
   * A list of keys or paths where the transformation won't be made.
   */
  exclude?: string[];
  /**
   * The delimiter that will separate the path components for both `include` and `exclude`.
   */
  pathDelimiter?: string;
};

export type FormatKeysExtensionOptions = Omit<FormatKeysOptions, 'search' | 'replace'>;

/**
 * Formats all the keys on an object using a way similar to `.replace(regexp, ...)` but
 * that also works recursively and with _"object paths"_.
 *
 * @param options  The set of options to customize the transformation.
 * @example
 *
 *   const target = {
 *     prop_one: 'Charito!',
 *   };
 *   console.log(
 *     ObjectUtils.formatKeys(
 *       target,
 *       // Find all the keys with snake case.
 *       /([a-z])_([a-z])/g,
 *       // Using the same .replace style callback, replace it with lower camel case.
 *       (fullMatch, firstLetter, secondLetter) => {
 *         const newSecondLetter = secondLetter.toUpperCase();
 *         return `${firstLetter}${newSecondLetter}`;
 *       },
 *     ),
 *   );
 *   // Will output { propOne: 'Charito!}.
 *
 */
export const formatKeys = <R = Record<string, unknown>>(
  options: FormatKeysOptions,
): R => {
  const {
    target,
    search,
    replace,
    include = [],
    exclude = [],
    pathDelimiter = '.',
  } = options;
  // Re-case target.
  const useTarget = target as Record<string, unknown>;
  // First of all, get all the keys from the target.
  const keys = Object.keys(target as Record<string, unknown>);
  /**
   * Then, check which keys are parent to other objects.
   * This is saved on a dictionary not only because it makes it easier to check if the
   * method should make a recursive call for a key, but also because when parsing the
   * `exclude`
   * parameter, if one of items is a key (and not an specific path), the method won't make
   * the recursive call.
   *
   * @ignore
   */
  const hasChildrenByKey: Record<string, unknown> = {};
  keys.forEach((key) => {
    const value = useTarget[key];
    hasChildrenByKey[key] = !!(
      value &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value)
    );
  });
  /**
   * Escape the path delimiter and create two regular expression: One that removes the path
   * delimiter from the start of a path and one that removes it from the end.
   * They are later used to normalize paths in order to avoid "incomplete paths" (paths that
   * end or start with the delimiter).
   */
  const escapedPathDelimiter = pathDelimiter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const cleanPathStartExpression = new RegExp(`^${escapedPathDelimiter}`, 'i');
  const cleanPathEndExpression = new RegExp(`${escapedPathDelimiter}$`, 'i');
  /**
   * This dictionary will be used to save the `include` parameter that will be sent for specific
   * keys on recursive calls.
   * If `include` has a path like `myKey.mySubKey`, `myKey` is not transformed, but `mySubKey`
   * is saved on this dictionary (`{ myKey: ['mySubKey']}`) and when the method applies the
   * formatting to the object, if `myKey` has an object, it will make a recursive all and
   * send `['mySubKey]` as its `include` parameter.
   */
  const subIncludeByKey: Record<string, string[]> = {};
  /**
   * This will be an array containing the final list of `keys` that should be tranformed.
   * To be clear, these keys will be from the top level, so, they won't be paths.
   * Thd following blocks will parse `include` and `exclude` in order to extract the real keys,
   * prepare the `include` and `exclude` for recursive calls, and save the actual keys
   * from the object "at the current level of this call" (no, it's not thinking about the
   * children :P).
   */
  let keysToFormat: string[];
  // If the `include` parameter has paths/keys...
  if (include.length) {
    keysToFormat = include
      .map((includePath) => {
        // Normalize the path/key.
        const useIncludePath = includePath
          .replace(cleanPathStartExpression, '')
          .replace(cleanPathEndExpression, '');
        // Define the variable that will, eventually, have the real key.
        let key;
        // If the value is a path...
        if (useIncludePath.includes(pathDelimiter)) {
          // Split all its components.
          const pathParts = useIncludePath.split(pathDelimiter);
          // Get the first component, a.k.a. the real key.
          const pathKey = pathParts.shift()!;
          /**
           * This is very important: Since the path was specified with sub components
           * (like `myProp.mySubProp`), the method won't format the key, but the sub
           * key(s)
           * (`mySubProp`).
           * The `key` is set to `''` so it will be later removed using `.filter`.
           *
           * @ignore
           */
          key = '';
          /**
           * If there's no array for the key on the "`include` dictionary for recursive calls",
           * create an empty one.
           */
          if (!subIncludeByKey[pathKey]) {
            subIncludeByKey[pathKey] = [];
          }
          // Save the rest of the path to be sent on the recursive call as `include`.
          subIncludeByKey[pathKey]!.push(pathParts.join(pathDelimiter));
        } else {
          // If the value wasn't a path, assume it's a key, and set it to be returned.
          key = useIncludePath;
        }

        return key;
      })
      // Remove any _empty keys_.
      .filter((key) => key);
  } else {
    // There's nothing on the `include` parameter, so use all the keys.
    keysToFormat = keys;
  }
  /**
   * Similar to `subIncludeByKey`, this dictionary will be used to save the `exclude` parameter
   * that will be sent for specific keys on recursive calls.
   * If `exclude` has a path like `myKey.mySubKey`, `myKey` will be transformed, but `mySubKey`
   * is saved on this dictionary (`{ myKey: ['mySubKey']}`) and when the method applies the
   * formatting to the object, if `myKey` has an object, it will make a recursive all and
   * send `['mySubKey]` as its `exclude` parameter.
   */
  const subExcludeByKey: Record<string, string[]> = {};
  // If the `include` parameter has paths/keys...
  if (exclude.length) {
    /**
     * Create a dictionary of keys that should be removed from `keysToFormat`.
     * It's easier to have them on a list and use `.filter` than actually call `.splice` for
     * every key that should be removed.
     */
    const keysToRemove: string[] = [];
    exclude.forEach((excludePath) => {
      // Normalize the path/key.
      const useExcludePath = excludePath
        .replace(cleanPathStartExpression, '')
        .replace(cleanPathEndExpression, '');
      // If the value is a path...
      if (useExcludePath.includes(pathDelimiter)) {
        // Split all its components.
        const pathParts = useExcludePath.split(pathDelimiter);
        // Get the first component, a.k.a. the real key.
        const pathKey = pathParts.shift()!;
        /**
         * If there's no array for the key on the "`exclude` dictionary for recursive calls",
         * create an empty one.
         */
        if (!subExcludeByKey[pathKey]) {
          subExcludeByKey[pathKey] = [];
        }
        // Save the rest of the path to be sent on the recursive call as `exclude`.
        subExcludeByKey[pathKey]!.push(pathParts.join(pathDelimiter));
      } else {
        /**
         * If the value wasn't a path, assume it's a key, turn the flag on the "children
         * dictionary" to `false`, to prevent recursive calls, and add the key to the list
         * of keys that will be removed from `keysToFormat`.
         * Basically: If it's a key, don't format it and don't make recursive calls for
         * it.
         *
         * @ignore
         */
        hasChildrenByKey[useExcludePath] = false;
        keysToRemove.push(useExcludePath);
      }
    });
    // Remove keys that should be excluded.
    keysToFormat = keysToFormat.filter((key) => key && !keysToRemove.includes(key));
  }
  // "Finally", reduce all the keys from the object and create the new one...
  return keys.reduce<Record<string, unknown>>((newObj, key) => {
    /**
     * Define the new key and value for the object property. Depending on the validations,
     * they may be replaced with formatted ones.
     */
    let newKey;
    let newValue;
    /**
     * Get the current value for the key, in case it's needed for a recursive call or just
     * to send it back because it didn't need any change.
     */
    const value = useTarget[key];
    // If the key should be formatted, apply the formatting; otherwise, keep the original.
    if (keysToFormat.includes(key)) {
      newKey = key.replace(search, replace);
    } else {
      newKey = key;
    }
    /**
     * If the paths/keys on `exclude` didn't modify the "children dictionary" for the key and
     * the value is another object, make a recursive call; otherwise, just use the original
     * value.
     */
    if (hasChildrenByKey[key]) {
      newValue = formatKeys({
        target: value,
        search,
        replace,
        include: subIncludeByKey[key] || [],
        exclude: subExcludeByKey[key] || [],
        pathDelimiter,
      });
    } else {
      newValue = value;
    }
    // "Done", return the new object with the "new key" and the "new value".
    return { ...newObj, [newKey]: newValue };
  }, {}) as R;
};
