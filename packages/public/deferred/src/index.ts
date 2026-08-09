export type DeferredPromiseResolveFn<Value> = (value: Value) => void;
export type DeferredPromiseRejectFn = (reason: unknown) => void;

export type DeferredPromise<Value> = {
  promise: Promise<Value>;
  resolve: DeferredPromiseResolveFn<Value>;
  reject: DeferredPromiseRejectFn;
};

/**
 * Creates a deferred promise.
 *
 * @template Value The type of the value that will be resolved.
 * @returns An object with a deferred promise, and its resolve and reject functions.
 */
export const deferred = <Value = string>(): DeferredPromise<Value> => {
  let resolve: DeferredPromiseResolveFn<Value>;
  let reject: DeferredPromiseRejectFn;
  const promise = new Promise<Value>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    // @ts-expect-error -- `resolve` is defined inside the promise.
    resolve,
    // @ts-expect-error -- `reject` is defined inside the promise.
    reject,
  };
};
