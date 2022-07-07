# 🗂 Path utils

An easy way to manage locations and build paths relative to those locations on a Node app.

When writing static `require`/`import` statements is easy: The file you are requiring is relative to the one you are updating. But when you are reading files or doing `require`/`import` with dynamic paths, it can get messy pretty fast, and that's where this utility shines.

## 🍿 Usage

> - ⚠️ **This package is only for Node**.
> - If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

Let's say your app tree looks like this:

```
myApp/
├── config/
│   ├── development.js
│   └── production.js
└── app/
    └── index.js
```

And you want to access `config/development.js`, but when you build your app, or prepare it to deployment, it becomes this:

```
myApp/
├── dist/
│   └── app/
│       └── index.min.js
├── config/
│   ├── development.js
│   └── production.js
└── app/
    └── index.js
```

There's a lot of ways to check whether you need to call `../config` or `../../config`: `TryCatch`, check some environment variable, check if `../config` exists, etc. Well, with `PathUtils`, you don't need to do that, because the service knowns that if you ask for `config/development.js`, it's relative to your project root directory.

```ts
import { pathUtils } from '@homer0/path-utils';

const paths = pathUtils();
const devConfigPath = paths.join('config/development');
// or paths.join('config', 'development');
```

Done, now you can `require`/`import` or even use `fs` to access the file.

#### Multiple locations

By default, `PathUtils` uses the `home` location, which is the project root directory, but it also has an `app` location, and the ability to register new locations:

The `app` location is the directory where your app executable file is located, for the project tree used on the example above, the `app` location is `/app` on development, and `/dist/app` when builded/deployed. Those paths are assuming you are running the app with `node [file]` and not through som other tool, as the `app` path is basically `process.argv[1]`.

Now, to register new locations, you use the `addLocation` method:

```js
pathUtils.addLocation('my-location', 'some-folder/some-sub-folder');
```

The new location path **must** be relative to your project root directory.

Then, to use those locations, you can call `joinFrom` instead of `join`:

```js
const pathToFile = pathUtils.joinFrom('my-location', 'some-file.js');
```

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `PathUtils` as the `pathUtils` service by using its provider:

```ts
import { pathUtilsProvider } from '@homer0/path-utils';

// ...

container.register(pathUtilsProvider);

// ...

const paths = container.get('pathUtils');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name, and even the constructor options:

```ts
container.register(
  pathUtilsProvider({
    serviceName: 'myPathUtils',
    home: '/some-other-root-folder',
    locations: {
      'my-location': '/some-other-root-folder/some-folder',
    },
  }),
);
```

### 🤘 Development

As this project is part of the `packages` monorepo, it requires Yarn, and some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Yarn tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |

## Motivation

This used to be part of the [`wootils`](https://www.npmjs.com/package/wootils) package, my personal lib of utilities, but I decided to extract them into individual packages, as part of the `packages` monorepo, and take the oportunity to migrate them to TypeScript.

Nowadays there's almost no app that doesn't make requests to one or more external APIs, that's why I built this service.
