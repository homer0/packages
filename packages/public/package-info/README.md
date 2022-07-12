# 📦 Package info

A tiny service that reads the contents of the project's `package.json`, sync & async.

## 🍿 Usage

> ⚠️ **This package is only for Node**.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Example

```ts
import { packageInfo } from '@homer0/package-info';

const pkg = packageInfo();

// ...

const info = await pkg.get();
// or
const info = pkg.getSync();
```

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `PackageInfo` as the `packageInfo` service by using its provider:

```ts
import { packageInfoProvider } from '@homer0/package-info';

// ...

container.register(packageInfoProvider);

// ...

const info = container.get('packageInfo');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name:

```ts
container.register(
  packageInfoProvider({
    serviceName: 'myPackageInfo',
  }),
);
```

##### Dependencies

`PackageInfo` depends on the following services, and when used with Jimple, it will try to find them in the container, otherwise, it will create new instances:

- [`@homer0/path-utils`](https://npmjs.com/package/@homer0/path-utils), with the name `pathUtils`. Used to generate the paths relative to the project root.

If you already implement the dependencies, but with a different name, you can specify them in the provider:

```ts
container.register(
  packageInfoProvider({
    services: {
      pathUtils: 'myPathUtils',
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
