# ⚓️ Root file

Import or require a file for the project root.

## 🍿 Usage

> ⚠️ **This package is only for Node**.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Example

```ts
import { rootFile } from '@homer0/root-file';

const root = rootFile();

// ...

const info = await root.import('some-file.js');
// or
const info = root.require('some-file.js');
```

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `RootFile` as the `rootFile` service by using its provider:

```ts
import { rootFileProvider } from '@homer0/root-file';

// ...

container.register(rootFileProvider);

// ...

const env = container.get('rootFile');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name:

```ts
container.register(
  rootFileProvider({
    serviceName: 'myRootFile',
  }),
);
```

##### Dependencies

`RootFile` depends on the following services, and when used with Jimple, it will try to find them in the container, otherwise, it will create new instances:

- [`@homer0/path-utils`](https://npmjs.com/package/@homer0/path-utils), with the name `pathUtils`. Used to generate the paths relative to the project root.

If you already implement the dependencies, but with a different name, you can specify them in the provider:

```ts
container.register(
  rootFileProvider({
    services: {
      pathUtils: 'myPathUtils',
    },
  }),
);
```

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### NPM tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |
