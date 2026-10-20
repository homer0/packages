/* oxlint-disable typescript/no-unsafe-function-type */
export function assert(ok: unknown, message: string): asserts ok {
  if (!ok) {
    throw new Error(message);
  }
}

export const isFunction = (fn: unknown): fn is Function =>
  Object.prototype.toString.call(fn) === '[object Function]' &&
  (fn as object).constructor.name === 'Function';

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

type ContainerLike = {
  has: (key: string) => boolean;
};

export const checkDefined = (container: ContainerLike, key: string): void => {
  assert(container.has(key), `Identifier "${key}" is not defined.`);
};

export const addFunctionTo = <T extends Function>(set: Set<Function>, fn: T): T => {
  assert(isFunction(fn), 'Service definition is not a Closure or invokable object');
  set.add(fn);
  return fn;
};
