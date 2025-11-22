export type DeepAssignArrayMode = 'merge' | 'shallowMerge' | 'concat' | 'overwrite';

export type DeepAssignOptions = {
  /**
   * Defines how array assignments should be handled.
   */
  arrayMode: DeepAssignArrayMode;
};

/**
 * It allows for deep merge (and copy) of objects and arrays using native spread syntax.
 *
 * This class exists just to scope the different functionalities and options needed for the
 * {@link DeepAssign#assign} method to work.
 */
export class DeepAssign {
  /**
   * Shortcut method to create a new instance and get its `assign` method.
   *
   * @param options  The options for the class constructor.
   */
  static fn(options: Partial<DeepAssignOptions> = {}): DeepAssign['assign'] {
    return new DeepAssign(options).assign;
  }
  /**
   * The options that define how {@link DeepAssign#assign} works.
   */
  readonly options: DeepAssignOptions;
  /**
   * @param options  Custom options for how the assignation it's going to work.
   * @throws {Error} If `options.arrayMode` is not a valid {@link DeepAssignArrayMode}.
   */
  constructor(options: Partial<DeepAssignOptions> = {}) {
    if (
      options.arrayMode &&
      !['merge', 'concat', 'overwrite', 'shallowMerge'].includes(options.arrayMode)
    ) {
      throw new Error(`Invalid array mode received: \`${options.arrayMode}\``);
    }

    this.options = {
      arrayMode: 'merge',
      ...options,
    };

    /**
     * @ignore
     */
    this.assign = this.assign.bind(this);
  }
  /**
   * Makes a deep merge of a list of objects and/or arrays.
   *
   * @param targets  The objects to merge; if one of them is not an object nor an
   *                 array, it will be ignored.
   * @template T  The type of the object that will be returned.
   * @throws {Error} If no targets are sent.
   */
  assign<T = unknown>(...targets: unknown[]): T {
    if (!targets.length) {
      throw new Error('No targets received');
    }

    return targets
      .filter((target) => this.isValidItem(target))
      .reduce(
        (acc, target) =>
          acc === null
            ? this.resolveFromEmpty(target, true)
            : this.resolve(acc, target, true),
        null,
      ) as T;
  }
  /**
   * Checks if an object is a plain `Object` and not an instance of some class.
   *
   * @param target  The object to validate.
   */
  protected isPlainObject(target: unknown): boolean {
    return (
      target !== globalThis &&
      target !== null &&
      Object.getPrototypeOf(target).constructor.name === 'Object'
    );
  }
  /**
   * Checks if an object can be used on a merge: only arrays and plain objects are
   * supported.
   *
   * @param target  The object to validate.
   */
  protected isValidItem(target: unknown): boolean {
    return Array.isArray(target) || this.isPlainObject(target);
  }
  /**
   * Merges two arrays into a new one. If the `concatArrays` option was set to `true` on
   * the constructor, the result will just be a concatenation with new references for the
   * items; but if the option was set to `false`, then the arrays will be merged over
   * their indexes.
   *
   * @param source  The base array.
   * @param target  The array that will be merged on top of `source`.
   * @param mode    The assignment strategy.
   */
  protected mergeArrays(
    source: unknown[],
    target: unknown[],
    mode: DeepAssignArrayMode,
  ): unknown[] {
    let result: unknown[];
    if (mode === 'concat') {
      result = [...source, ...target].map((targetItem) =>
        this.resolveFromEmpty(targetItem),
      );
    } else if (mode === 'overwrite') {
      result = target.slice().map((targetItem) => this.resolveFromEmpty(targetItem));
    } else if (mode === 'shallowMerge') {
      result = source.slice();
      target.forEach((targetItem, index) => {
        const resolved = this.resolveFromEmpty(targetItem);
        if (index < result.length) {
          result[index] = resolved;
        } else {
          result.push(this.resolveFromEmpty(targetItem));
        }
      });
    } else {
      result = source.slice();
      target.forEach((targetItem, index) => {
        if (index < result.length) {
          result[index] = this.resolve(result[index], targetItem);
        } else {
          result.push(this.resolveFromEmpty(targetItem));
        }
      });
    }

    return result;
  }
  /**
   * Merges two plain objects and their children.
   *
   * @param source  The base object.
   * @param target  The object which properties will be merged in top of `source`.
   */
  protected mergeObjects(source: unknown, target: unknown): unknown {
    const useSource = source as Record<string | symbol, unknown>;
    const useTarget = target as Record<string | symbol, unknown>;

    const keys = [...Object.getOwnPropertySymbols(useTarget), ...Object.keys(useTarget)];

    const subMerge = keys.reduce<Record<string | symbol, unknown>>(
      (acc, key) => ({
        ...acc,
        [key]: this.resolve(useSource[key], useTarget[key]),
      }),
      {},
    );

    return { ...useSource, ...useTarget, ...subMerge };
  }
  /**
   * This is the method the class calls when it has to merge two objects and it doesn't
   * know which types they are; the method takes care of validating compatibility and
   * calling either {@link DeepAssign#mergeObjects} or {@link DeepAssign#mergeArrays}.
   * If the objects are not compatible, or `source` is not defined, it will return a copy
   * of `target`.
   *
   * @param source           The base object.
   * @param target           The object that will be merged in top of `source`.
   * @param ignoreArrayMode  Whether or not to ignore the option that tells the class
   *                         how array assignments should be handled. This parameter
   *                         exists because, when called directly from
   *                         {@link DeepAssign#assign}, it doesn't make sense to use a
   *                         strategy different than 'merge'.
   */
  protected resolve(source: unknown, target: unknown, ignoreArrayMode = false): unknown {
    let result: unknown;
    const targetIsUndefined = typeof target === 'undefined';
    const sourceIsUndefined = typeof source === 'undefined';
    if (!targetIsUndefined && !sourceIsUndefined) {
      if (Array.isArray(target) && Array.isArray(source)) {
        const { arrayMode } = this.options;
        const useMode =
          ignoreArrayMode && !['merge', 'shallowMerge'].includes(arrayMode)
            ? 'merge'
            : arrayMode;
        result = this.mergeArrays(source, target, useMode);
      } else if (this.isPlainObject(target) && this.isPlainObject(source)) {
        result = this.mergeObjects(source, target);
      } else {
        result = target;
      }
    } else if (!targetIsUndefined) {
      result = this.resolveFromEmpty(target);
    }

    return result;
  }
  /**
   * This method is a helper for {@link DeepAssign#resolve}, and it's used for when the
   * class has the `target` but not the `source`: depending on the type of the `target`,
   * it calls resolves with an empty object of the same type; if the `target` can't be
   * merged, it just returns it as it was received, which means that is a type that
   * doesn't hold references.
   *
   * @param target                   The target to copy.
   * @param [ignoreArrayMode=false]  Whether or not to ignore the option that tells the
   *                                 class how array assignments should be handled.
   *                                 This parameter exists because, when called
   *                                 directly from {@link DeepAssign#assign}, it
   *                                 doesn't make sense to use a strategy different
   *                                 than 'merge'.
   */
  protected resolveFromEmpty(target: unknown, ignoreArrayMode = false): unknown {
    let result: unknown;
    if (Array.isArray(target)) {
      result = this.resolve([], target, ignoreArrayMode);
    } else if (this.isPlainObject(target)) {
      result = this.resolve({}, target);
    } else {
      result = target;
    }

    return result;
  }
}
