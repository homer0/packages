/* eslint-disable @typescript-eslint/no-explicit-any */

export type GenericFn = (...args: any[]) => any;

export type GenericCurriedFn<ReturnFn = GenericFn> = (...args: any[]) => ReturnFn;

export type Resource<Name extends string, Key extends string, Fn extends GenericFn> = {
  [NameItem in Name]: true;
} & {
  [KeyItem in Key]: Fn;
} & Record<string, unknown>;

export type ResourceCreatorCurriedFn<
  Name extends string,
  Key extends string,
  Fn extends GenericCurriedFn,
> = (...args: any[]) => Resource<Name, Key, ReturnType<Fn>>;

export type ResourceCreatorHandler<
  Name extends string,
  Key extends string,
  Fn extends GenericCurriedFn,
> = ProxyHandler<ResourceCreatorCurriedFn<Name, Key, Fn>> & {
  name: Name;
  resource: ReturnType<Fn> | null;
};

export type ResourceCreator<
  Name extends string,
  Key extends string,
  CreatorFn extends GenericCurriedFn,
  ResourceFn extends GenericFn,
> = ((...args: Parameters<CreatorFn>) => Resource<Name, Key, ResourceFn>) &
  Resource<Name, Key, ResourceFn>;
