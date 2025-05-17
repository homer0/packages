import type { Simplify } from 'type-fest';

// Core

export type RoutePathString = `/${string}`;

export type RoutePathDetail = {
  path: RoutePathString;
  queryParams?: ReadonlyArray<string>;
  optionalQueryParams?: ReadonlyArray<string>;
  comments?: Readonly<string>;
};

export type RoutePathDefinition = RoutePathString | RoutePathDetail;

interface BaseRouterPathGroups {
  root: RoutePathDefinition;
}

export interface RoutePathGroup extends BaseRouterPathGroups {
  [key: string]: RoutePathDefinition | RoutePathGroup;
}

// Utils

type HasAtLeastOneKey<T> = keyof T extends never ? false : true;

type PickKeysWithPartialValues<T> = keyof {
  [K in keyof T as undefined extends T[K] ? K : never]: K;
};

type HasAtLeastOneRequiredKey<T> = HasAtLeastOneKey<
  Omit<T, PickKeysWithPartialValues<T>>
>;

type HasAtLeastOneItem<T> = T extends readonly unknown[]
  ? T['length'] extends 0
    ? false
    : true
  : false;

type SimplifyReadonly<T> = Simplify<Readonly<T>>;

export type PathParams<
  T extends string,
  Acc extends readonly string[] = [],
> = T extends `${string}:${infer U}/${infer R}`
  ? PathParams<R, [...Acc, U]>
  : T extends `${string}:${infer U}`
    ? [...Acc, U]
    : Acc;

export type PathWithParams<T extends string, TP = PathParams<T>> = {
  path: T;
} & (HasAtLeastOneItem<TP> extends true ? { params: Readonly<TP> } : object);

export type RoutePathAsString<T extends RoutePathDefinition> = T extends RoutePathDetail
  ? T['path']
  : T;

export type PrefixedPath<
  RoutePath extends RoutePathDefinition,
  RootRoutePath extends RoutePathDefinition,
  RoutePathStr extends string = RoutePathAsString<RoutePath>,
  RootRoutePathStr extends string = RoutePathAsString<RootRoutePath>,
> = RootRoutePathStr extends '/' ? RoutePathStr : `${RootRoutePathStr}${RoutePathStr}`;

export type PrefixedName<
  RouteName extends string,
  ParentRouteName extends string = '',
> = ParentRouteName extends '' ? RouteName : `${ParentRouteName}.${RouteName}`;

export type FormattedRoutePathDefinition<
  PathDefinition extends RoutePathDefinition = RoutePathDefinition,
  RootPath extends RoutePathString = RoutePathString,
> = PathDefinition extends RoutePathDetail
  ? SimplifyReadonly<
      Omit<PathDefinition, 'path'> &
        PathWithParams<PrefixedPath<PathDefinition['path'], RootPath>>
    >
  : PathDefinition extends RoutePathString
    ? SimplifyReadonly<PathWithParams<PrefixedPath<PathDefinition, RootPath>>>
    : never;

// Inference

type FlattenGroup<
  Group extends RoutePathGroup,
  ParentName extends string = '',
  ParentRoot extends RoutePathString = '/',
  RootPath extends RoutePathString = ParentRoot extends '/'
    ? RoutePathAsString<Group['root']>
    : PrefixedPath<Group['root'], ParentRoot>,
> = {
  [K in keyof Group]: Group[K] extends RoutePathDefinition
    ? {
        [P in PrefixedName<K & string, ParentName>]: FormattedRoutePathDefinition<
          Group[K],
          RootPath
        >;
      }
    : Group[K] extends RoutePathGroup
      ? FlattenGroup<Group[K], PrefixedName<K & string, ParentName>, RootPath>
      : {
          [P in PrefixedName<K & string, ParentName>]: Group[K];
        };
}[keyof Omit<Group, 'root'>];

type Merge<T> = (T extends unknown ? (x: T) => void : never) extends (x: infer R) => void
  ? SimplifyReadonly<R>
  : never;

export type FormattedRoutePaths<T extends RoutePathGroup> = Merge<FlattenGroup<T>>;

// Route

export type RoutePath = RoutePathDetail & {
  params?: ReadonlyArray<string>;
};

type RouteParamsObject<T extends RoutePath> = Simplify<
  // - params
  (T extends {
    params: infer Params;
  }
    ? Params extends readonly string[]
      ? {
          [K in Params[number]]: string;
        }
      : object
    : object) &
    // - queryParams
    (T extends {
      queryParams: infer QueryParams;
    }
      ? QueryParams extends readonly string[]
        ? {
            [K in QueryParams[number]]: string;
          }
        : object
      : object) &
    // - optionalQueryParams
    (T extends {
      optionalQueryParams: infer OptionalQueryParams;
    }
      ? OptionalQueryParams extends readonly string[]
        ? {
            [K in OptionalQueryParams[number]]?: string;
          }
        : object
      : object)
>;

export type RoutePathParams<T extends RoutePath, P = RouteParamsObject<T>> =
  HasAtLeastOneKey<P> extends true
    ? HasAtLeastOneRequiredKey<P> extends true
      ? [P & Record<string, string>]
      : [(P & Record<string, string>) | undefined] | []
    : [Record<string, string>] | [];
