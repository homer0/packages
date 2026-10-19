/* oxlint-disable typescript/no-unsafe-function-type */
import {
  assert,
  isFunction,
  isPlainObject,
  checkDefined,
  addFunctionTo,
} from './helpers.js';

/**
 * The Jimple Container class
 *
 * @public
 */
export class Jimple {
  static provider<T extends (register: Jimple) => void>(
    register: T,
  ): {
    register: T;
  } {
    return { register };
  }

  _items: Record<string, unknown> = {};
  _instances: Map<unknown, unknown> = new Map();
  _factories: Set<Function> = new Set();
  _protected: Set<Function> = new Set();
  /**
   * Create a Jimple Container.
   *
   * @param values An optional object whose keys and values will be associated in the
   *   container at initialization.
   */
  constructor(values?: Record<string, unknown>) {
    const mappedValues = isPlainObject(values) ? values : {};
    Object.entries(mappedValues).forEach(([key, value]) => {
      this.set(key, value);
    }, this);
  }
  /**
   * Return the specified parameter or service. If the service is not built yet, this
   * function will construct the service injecting all the dependencies needed in it's
   * definition so the returned object is totally usable on the fly.
   *
   * @param key The key of the parameter or service to return
   * @returns The object related to the service or the value of the parameter associated
   *   with the key informed
   * @throws If the key does not exist
   */
  get<T = unknown>(key: string): T {
    checkDefined(this, key);
    const item = this._items[key];
    let obj: unknown;
    if (isFunction(item)) {
      if (this._protected.has(item)) {
        obj = item;
      } else if (this._instances.has(item)) {
        obj = this._instances.get(item);
      } else {
        obj = item(this);
        if (!this._factories.has(item)) {
          this._instances.set(item, obj);
        }
      }
    } else {
      obj = item;
    }
    return obj as T;
  }
  /**
   * Defines a new parameter or service.
   *
   * @param key The key of the parameter or service to be defined
   * @param value The value of the parameter or a function that receives the container as
   *   parameter and constructs the service
   */
  set(key: string, value: unknown): void {
    this._items[key] = value;
  }

  /**
   * Returns if a service or parameter with the informed key is already defined in the
   * container.
   *
   * @param key The key of the parameter or service to be checked.
   * @returns If the key exists in the container or not
   */
  has(key: string): boolean {
    return Object.hasOwn(this._items, key);
  }

  /**
   * Defines a service as a factory, so the instances are not cached in the service and
   * that function is always called
   *
   * @param fn The function that constructs the service that is a factory
   * @returns The same function passed as parameter
   */
  factory<C = this>(fn: (app: C) => unknown): (arg0: C) => unknown {
    return addFunctionTo(this._factories, fn);
  }

  /**
   * Defines a function as a parameter, so that function is not considered a service
   *
   * @param fn The function to not be considered a service
   * @returns The same function passed as parameter
   */
  protect<T extends () => unknown>(fn: T): T {
    return addFunctionTo(this._protected, fn);
  }

  /** Return all the keys registered in the container */
  keys(): string[] {
    return Object.keys(this._items);
  }

  /**
   * Extends a service already registered in the container
   *
   * @param key The key of the service to be extended
   * @param fn The function that will be used to extend the service
   * @throws If the key is not already defined
   * @throws If the key saved in the container does not correspond to a service
   * @throws If the function passed it not...well, a function
   */
  extend<C = this>(key: string, fn: (original: unknown, app: C) => unknown): void {
    checkDefined(this, key);
    const originalItem = this._items[key];
    assert(
      isFunction(originalItem) && this._protected.has(originalItem) === false,
      `Identifier '${key}' does not contain a service definition`,
    );
    assert(
      isFunction(fn),
      `The 'new' service definition for '${key}' is not a invokable object.`,
    );
    this._items[key] = (app: C): unknown => fn(originalItem(app), app);

    if (this._factories.has(originalItem)) {
      this._factories.delete(originalItem);
      this._factories.add(this._items[key] as Function);
    }
  }

  /**
   * Uses an provider to extend the service, so it's easy to split the service and
   * parameter definitions across the system
   *
   * @param provider The provider to be used to register services and parameters in this
   *   container
   */
  register<C = this>(provider: { register: (arg0: C) => void }): void {
    provider.register(this as unknown as C);
  }

  /**
   * Returns the raw value of a service or parameter. So, in the case of a service, for
   * example, the value returned is the function used to construct the service.
   *
   * @param key - The key of the service or parameter to return.
   * @returns The raw value of the service or parameter
   * @throws If the key does not exist in the container
   */
  raw<T = unknown>(key: string): T {
    checkDefined(this, key);
    return this._items[key] as T;
  }
}
