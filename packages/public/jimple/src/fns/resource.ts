// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericFn = (...args: any[]) => unknown;
type Resource<N extends string, K extends string, F extends GenericFn> = {
  [NN in N]: true;
} & {
  [KK in K]: F;
} & Record<string, unknown>;
/**
 * Generates a resource entity with a specific function Jimple or an abstraction of jimple
 * can make use of.
 *
 * @param name  The name of the resource. The generated object will have a property
 *              with its name and the value `true`.
 * @param key   The name of the key that will have the function on the generated
 *              object.
 * @param fn    The function to interact with the resource.
 * @example
 *
 * <caption>
 *   The `provider` shorthand function is an _entity_ with a `register` function:
 * </caption>
 *
 *   const someProvider = resource('provider', 'register', (app) => {
 *     // ...
 *   });
 *
 */
export const resource = <N extends string, K extends string, F extends GenericFn>(
  name: N,
  key: K,
  fn: F,
): Resource<N, K, F> =>
  ({
    [name]: true,
    [key]: fn,
  } as Resource<N, K, F>);
