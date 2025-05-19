# 🚏 Routes manager

Create and manage a collection of typed routes for your app.

The main feature of this library is the typing, as it will auto complete the names and the parameters of the routes.

## 🍿 Usage

- ⚙️ [Setup](#%EF%B8%8F-setup)
- 🛤️ [Defining a route](#%EF%B8%8F-defining-a-route)
- ⚡️ [Using groups](#%EF%B8%8F-using-groups)
- 🤘 [Development](#-development)

### ⚙️ Setup

You first needs to create an instance of the manager with the routes definitions:

```ts
// routes.ts

import { createRoutesManager } from '@homer0/routes-manager';

export const routes = createRoutesManager({
  // You always need a `root` for a group of routes.
  root: '/',
  // A route can be just a string,
  home: '/',
  // or an object with more details,
  login: {
    path: '/login',
    optionalQueryParams: ['redirectTo'],
  },
  // or a sub group of routes.
  account: {
    // A sub group also needs a `root`.
    root: '/account',
    home: '/',
    settings: {
      root: '/settings',
      connection: '/connections/:connectionId',
      removeMe: {
        path: '/remove-account',
        queryParams: ['confirm'],
      },
    },
  },
});
```

After that, you can use the instance to generate paths:

```ts
// some-other-file.ts

import { routes } from './routes';

// It won't ask for parameters and will return '/'
const homeRoute = routes.getPath('home');
// It won't ask for parameters and will return '/login'
const loginRoute = routes.getPath('login');
// You can optional send the `redirectTo` parameter and will return '/login?redirectTo=/account'
const loginRouteWithRedirect = routes.getPath('login', {
  redirectTo: routes.getPath('account.home'),
});
// It will ask for `connectionId` and will return `/account/settings/connections/123`
const connectionRoute = routes.getPath('account.settings.connection', {
  connectionId: '123',
});
// You can also send unknown parameters, and it will add them in the query string.
// In this case, it will return `/account/settings/connections/123?foo=bar`
const connectionRouteWithFoo = routes.getPath('account.settings.connection', {
  connectionId: '123',
  foo: 'bar',
});
```

### 🛤️ Defining a route

A route can be defined as a string that starts with a `/`, or as an object with the following properties:

```ts
import { createRoutesManager } from '@homer0/routes-manager';

export const routes = createRoutesManager({
  root: '/',
  // Simple string route
  home: '/',
  // String route with parameters
  category: '/category/:categoryId',
  // Object route
  login: {
    // The path of the route.
    path: '/login',
    // Optional query parameters.
    optionalQueryParams: ['redirectTo'],
    // Required query parameters.
    queryParams: ['token'],
  },
  // Object route with parameters
  tag: {
    // The path of the route.
    path: '/tags/:tagId',
    // Optional query parameters.
    optionalQueryParams: ['page'],
    // Required query parameters.
    queryParams: ['sort'],
  },
});
```

If a route has parameters in its path or it defines `queryParams`, the second argument of the `getPath` method will be required, but if it doesn't, it will be optional, with types for `optionalQueryParams`, if present.

### ⚡️ Using groups

Groups allow you to create a collection of routes under a common root, and better organize your routes. When creating your routes definition, adding a group is as simple as adding an object with a `root` property:

```ts
import { createRoutesManager } from '@homer0/routes-manager';

export const routes = createRoutesManager({
  root: '/',
  home: '/',
  category: '/category/:categoryId',
  // A group of routes.
  tags: {
    root: '/tags',
    // A route inside the group.
    view: '/:tagId',
  },
});
```

All routes in a group are prefixed by the group's `root` and the parent group's `root`: As you may have noticed already, the definition's root is just another group.

When accessing a route in a group, you'll need to use the group name as a prefix, so the `getPath` method will look like this:

```ts
routes.getPath('tags.view', {
  tagId: '123',
});
```

> And yes, everything is typed and auto-completed even in sub groups/routes.

You could also use parameters in a group's `root`, and all its routes (and possible sub groups' routes) will inherit them:

```ts
import { createRoutesManager } from '@homer0/routes-manager';

export const routes = createRoutesManager({
  root: '/',
  home: '/',
  category: '/category/:categoryId',
  tag: {
    root: '/tags/:tagId',
    // A route inside the group.
    view: '/view',
    manage: {
      root: '/manage',
      // A route inside a sub group.
      edit: '/edit',
    },
  },
});
```

If we look at the `tag` group, you'll need to send the `tagId` parameter to access any of its routes:

```ts
const viewTagRoute = routes.getPath('tag.view', {
  tagId: '123',
});
const editTagRoute = routes.getPath('tag.manage.edit', {
  tagId: '123',
});
```

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like `lint-staged` and `husky`, are installed on the root's `package.json`.

#### Tasks

| Task          | Description                         |
| ------------- | ----------------------------------- |
| `lint`        | Lints the package.                  |
| `test`        | Runs the unit tests.                |
| `build`       | Transpiles and bundles the project. |
| `types:check` | Validates the TypeScript types.     |

## Motivation

I always liked the idea of using named routes in an app, rather than harcoded strings, but most of the solutions I found were not strongly typed, or were connected to a specific framework/routing library; I just wanted to define my routes, call them by name, and get auto-completion.
