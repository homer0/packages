type ExtractGeneric<Type> = Type extends Promise<infer X> ? X : never;

type ExtendedPromise<T extends Promise<unknown>, P, V = ExtractGeneric<T>> = Omit<
  T,
  'then' | 'catch' | 'finally'
> &
  P & {
    then: (...args: Parameters<T['then']>) => ExtendedPromise<Promise<V>, P>;
    catch: (...args: Parameters<T['catch']>) => ExtendedPromise<Promise<V>, P>;
    finally: (...args: Parameters<T['finally']>) => ExtendedPromise<Promise<V>, P>;
  };
type GenericFn = (...args: unknown[]) => unknown;
type ExtendedFn<F extends GenericFn, P> = F & P;

/**
 * Helper class that creates a proxy for a {@link Promise} in order to add custom
 * properties.
 *
 * The only reason this class exists is so it can "scope" the necessary methods to extend
 * {@link Promise} and avoid workarounds in order to declare them, as they need to call
 * themselves recursively.
 */
class PromiseExtender<T extends Promise<unknown>, P extends Record<string, unknown>> {
  /**
   * The proxied promise.
   */
  readonly promise: ExtendedPromise<T, P>;
  /**
   * @param promise     The promise to extend.
   * @param properties  A dictionary of custom properties to _inject_ in the promise
   *                    chain.
   */
  constructor(promise: T, properties: P) {
    this.promise = this.extend(promise, properties);
  }
  /**
   * The method that actually extends a promise: it creates a proxy of the promise in
   * order to intercept the getters so it can return the custom properties if requested,
   * and return new proxies when `then`, `catch` and `finally` are called; the reason new
   * proxies are created is because those methods return new promises, and without being
   * proxied, the custom properties would be lost.
   *
   * @param promise     The promise to proxy.
   * @param properties  A dictionary of custom properties to _inject_ in the promise
   *                    chain.
   * @throws {Error} If `promise` is not a valid instance of {@link Promise}.
   * @throws {Error} If `properties` is not an object or if it doesn't have any
   *                 properties.
   */
  extend(promise: T, properties: P): ExtendedPromise<T, P> {
    if (!(promise instanceof Promise)) {
      throw new Error("'promise' must be a valid Promise instance");
    }

    if (!properties || !Object.keys(properties).length) {
      throw new Error("'properties' must be an object with at least one key");
    }

    const extended = new Proxy(promise, {
      /**
       * This is a trap for when something is trying to read/access a property for the
       * promise.
       * The function first validates if it's one of the functions
       * (`then`/`catch`/`finally`) in order to return a proxied function; then, if it's
       * another function (one that doesn't return another promise), it just calls the
       * original; finally, before doing a fallback to the original promise, it checks if
       * it's one of the custom properties that exented the promise.
       *
       * @param target  The original promise.
       * @param name    The name of the property.
       */
      get: (target, name) => {
        const targetKey = name as keyof typeof target;
        if (
          typeof name === 'string' &&
          ['then', 'catch', 'finally'].includes(name) &&
          name in target
        ) {
          const fn = target[targetKey] as unknown as GenericFn;
          return this.extendFunction(fn.bind(target), properties);
        }

        if (name in target) {
          const possibleFn = target[targetKey] as unknown as Record<string, unknown>;
          if (typeof possibleFn['bind'] === 'function') {
            return possibleFn['bind'](target);
          }
        }

        const key = name as keyof P;
        return properties[key];
      },
    });

    return extended as unknown as ExtendedPromise<T, P>;
  }
  /**
   * Creates a proxy for a promise function (`then`/`catch`/`finally`) so the returned
   * promise can also be extended.
   *
   * @param fn          The promise function to proxy.
   * @param properties  A dictionary of custom properties to _inject_ in the promise
   *                    chain.
   */
  protected extendFunction<F extends GenericFn>(fn: F, properties: P): ExtendedFn<F, P> {
    return new Proxy(fn, {
      /**
       * This is a trap for when a function gets called (remember this gets used for
       * `then`/
       * `catch`/`finally`); it processes the result using the oringinal function and
       * since promise methods return a promise, instead of returning the original result,
       * it returns an _extended_ version of it.
       *
       * @param target   The original function.
       * @param thisArg  The promise the function belongs to.
       * @param args     The list of arguments sent to the trap.
       */
      apply: (target, thisArg, args) => {
        const value = target.bind(thisArg)(...args);
        return this.extend(value as T, properties);
      },
    }) as ExtendedFn<F, P>;
  }
}

/**
 * Extends a {@link Promise} by injecting custom properties using a {@link Proxy}. The
 * custom properties will be available on the promise chain no matter how many `then`s,
 * `catch`s or `finally`s are added.
 *
 * @param promise     The promise to extend.
 * @param properties  A dictionary of custom properties to _inject_ in the promise
 *                    chain.
 * @throws {Error} If `promise` is not a valid instance of {@link Promise}.
 * @throws {Error} If `properties` is not an object or if it doesn't have any
 *                 properties.
 */
export const extendPromise = <
  T extends Promise<unknown>,
  P extends Record<string, unknown>,
>(
  promise: T,
  properties: P,
): ExtendedPromise<T, P> => new PromiseExtender(promise, properties).promise;
