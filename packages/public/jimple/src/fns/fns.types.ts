/* eslint-disable @typescript-eslint/no-explicit-any */

export type GenericFn = (...args: any[]) => any;

export type GenericCurriedFn = (...args: any[]) => GenericFn;

export type Resource<N extends string, K extends string, F extends GenericFn> = {
  [NN in N]: true;
} & {
  [KK in K]: F;
} & Record<string, unknown>;

export type ResourceCreatorCurriedFn<
  N extends string,
  K extends string,
  F extends GenericCurriedFn,
> = (...args: any[]) => Resource<N, K, ReturnType<F>>;

export type ResourceCreatorHandler<
  N extends string,
  K extends string,
  F extends GenericCurriedFn,
> = ProxyHandler<ResourceCreatorCurriedFn<N, K, F>> & {
  name: N;
  resource: ReturnType<F> | null;
};

export type ResourceCreator<
  N extends string,
  K extends string,
  F extends GenericCurriedFn,
> = ((...args: Parameters<F>) => Resource<N, K, ReturnType<F>>) &
  Resource<N, K, ReturnType<F>>;
