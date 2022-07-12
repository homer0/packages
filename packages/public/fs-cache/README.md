# 🗄 FS Cache

Small cache utility that uses the file system and supports TTL.

## 🍿 Usage

> - ⚠️ **This package is only for Node**.
> - If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### Examples

This would be the basic usage:

```ts
import { fsCache } from '@homer0/fs-cache';

const cache = fsCache();

// ... sometime later, because there's not top-level await yet.

const data = await cache.use({
  key: 'my-key',
  init: async () => {
    const res = await fetch('https://example.com');
    const data = await res.json();
    return JSON.stringify(data);
  },
});
```

You call `use` with a unique `key` and a `init` function, the service will validate if there's a non-expired entry for that, and return it, otherwise it will call the `init` function and cache it.

#### JSON

The first example showed a simple example using `string`, since the `use` method works by reading and writing `string`s, but in most real case uses, the data you would want to cache is JSON.

Alternatively to `use`, you can use `useJSON`:

```ts
const data = await cache.useJSON({
  key: 'my-key',
  init: async () => {
    const res = await fetch('https://example.com');
    return res.json();
  },
});
```

#### Custom entries

The `useJSON` method actually uses a "custom entry" in order to transform the data before saving it, and when reading it back. "Custom entries" are created using `useCustom`, and they require a `serializer` and `deserializer`:

```ts
const data = await cache.useCustom({
  key: 'my-key',
  init: async () => {
    const res = await fetch('https://example.com');
    return res.json();
  },
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});
```

#### TTL

The service gives you a couple of ways in which you can control the TTL of the entries:

- In the constructor, you have `defaultTTL` and `maxTTL`.
- In each entry, you can set `ttl` to override the default TTL.

When an entry is created, a timeout is set to delete the entry after the TTL, but if some some reason the app is restarted, and the in-memory data get lost, the next time the entry is read, the service will validate the modification time of the file and see if it's still valid.

```ts
const data = await cache.useJSON({
  key: 'my-key',
  ttl: 60 * 60 * 1000, // 1 hour
  init: async () => {
    const res = await fetch('https://example.com');
    return res.json();
  },
});
```

#### Files

By default, all files are stored in a `.cache` folder, relative to your project root. You can cache the path, by using the `path` option when initializing the service:

> The path will always be relative to the project root.

```ts
const cache = fsCache({
  path: 'libs/.my-cache-folder',
});
```

#### In memory caching

By default, whenever an entry is created, the service will also store it in memory, so it will be able to respond faster the next time the data is requested.

You can disable this functionality with the `keepInMemory` option:

```ts
const cache = fsCache({
  keepInMemory: false,
});
```

But have in mind, that when creating an entry, that option can be overwritten (to enable, or disable):

```ts
const data = await cache.useJSON({
  key: 'my-key',
  keepInMemory: true,
  init: async () => {
    const res = await fetch('https://example.com');
    return res.json();
  },
});
```

#### Removing entries

If you want to ensure an entry is removed from both the file system and memory, you can use the `remove` method:

```ts
await cache.remove('my-key');
```

But you can also use `removeFromMemory`, or `removeFromFs`, to remove the entry from either cache.

When using `removeFromFs`, the custom options allow you to send a callback to actually evaluate if the entry should be removed. You may be thinking "why would I need the callback if I alaready told the service to remove it?", well, the callback will give you more information about the file, like when was it last modified, its absolute path, and whether or not it's expired.

```ts
await cache.removeFromFs('my-key', {
  shouldRemove: async ({ key, filepath, filename, mtime, expired }) => {
    // ...
    return true;
  },
});
```

And yes, you can also send the same callback to `remove`.

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `FsCache` as the `fsCache` service by using its provider:

```ts
import { fsCacheProvider } from '@homer0/fs-cache';

// ...

container.register(fsCacheProvider);

// ...

const cache = container.get('fsCache');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name:

```ts
container.register(
  fsCacheProvider({
    serviceName: 'myFsCache',
  }),
);
```

##### Dependencies

`FsCache` depends on the following services, and when used with Jimple, it will try to find them in the container, otherwise, it will create new instances:

- [`@homer0/path-utils`](https://npmjs.com/package/@homer0/path-utils), with the name `pathUtils`. Used to generate the paths relative to the project root.

If you already implement the dependencies, but with a different name, you can specify them in the provider:

```ts
container.register(
  fsCacheProvider({
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

## Motivation

While I was working on a small project, I wanted to use the file system as a cache, since the process was being restarted all the time.

I looked in the registry, but all the packages I found required for you to actually tell them when to cache and when to try to read something, and I just wanted something that would abstract that logic for me: a single function, one key and one function, you decide whether you can use the cache or you have to initialize the data.

Since I was migrating bunch of stuff to the monorepo, with TypeScript, and I already wrote it, I decided to make it into a package.
