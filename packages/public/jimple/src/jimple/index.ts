import { Jimple as JimpleMod } from '../jimplemod';

export class Jimple extends JimpleMod {
  /**
   * This is a version of the `get` method that doesn't throw if the key doesn't exist. It
   * will return `undefined` instead.
   *
   * @param key  The key of the parameter or service to return.
   * @returns The object related to the service or the value of the parameter
   *          associated with the given key.
   * @template T  The type of the returned object.
   */
  try<T = unknown>(key: string): T | undefined {
    if (!this.has(key)) {
      return undefined;
    }

    return this.get<T>(key);
  }
}

export const jimple = (...args: ConstructorParameters<typeof Jimple>): Jimple =>
  new Jimple(...args);
