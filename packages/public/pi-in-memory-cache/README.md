# 🧠 Pi In-Memory Cache

A shared in-memory cache for [Pi](https://pi.dev), kept by a small background daemon.

Pi extensions, tools, and skills run in different processes, so they can't share a variable. This package gives them a cache they can all read and write, for things that are expensive to get and fine to keep for a while, like a token or a response from a slow service.

## 🍿 Usage

> - ⚠️ **This package is for Pi.** It registers a Pi extension and it reads Pi's config; it's not a general-purpose cache.
> - If you are wondering why I built this, go to the [📝 Motivation](#-motivation) section.

- 📦 [Installation](#-installation)
  - [As an extension](#as-an-extension)
  - [As a library](#as-a-library)
- 🔌 [How it works](#-how-it-works)
- 🧙 [Config](#-config)
- 🧰 [Commands](#-commands)
- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)
- 📝 [Motivation](#-motivation)

### 📦 Installation

You can use this package as an extension, which adds commands to manage the daemon, or as a library, to use the cache from your own extension, tool, or skill.

#### As an extension

```bash
pi install npm:@homer0/pi-in-memory-cache
```

This will add the [commands](#-commands) to manage the daemon. The daemon itself doesn't start with Pi: it starts the first time something uses the cache.

#### As a library

```bash
pnpm add @homer0/pi-in-memory-cache
```

> `@earendil-works/pi-coding-agent` is a peer dependency: Pi provides it to your extension, so don't bundle it.

Installing it as a dependency will give you access to an ESM module with the following functions:

| Function          | What it does                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `getCached`       | Returns the value of a key, or gets it with your function and stores it if it's not there. |
| `getEntry`        | Returns the value of a key, or `undefined`. It never fetches or writes.                    |
| `setEntry`        | Stores a value, replacing the one that was there.                                          |
| `removeEntry`     | Removes a key. It doesn't fail if the key doesn't exist.                                   |
| `getDaemonStatus` | Returns the daemon diagnostics, or `null` if it's not running. It never starts the daemon. |
| `stopDaemon`      | Stops the daemon. It fails if the daemon is not running.                                   |
| `flushCache`      | Removes all the entries and returns how many there were. It fails if it's not running.     |
| `restartDaemon`   | Stops the daemon if it's running, starts a new one, and returns its PID.                   |

The functions that read or write entries start the daemon if it's not running.

### 🔌 How it works

- The first call to a function that reads or writes entries starts the daemon: a detached process, run with [jiti](https://github.com/unjs/jiti), that is not tied to the process that started it, so it keeps running when that one exits.
- The daemon listens on a Unix socket, and it's shared by everything that uses the same installation of this package. The socket is a file next to the package's code, so two different installations have two different caches.
- Everything is in memory: the values are lost when the daemon stops or restarts. Values travel as JSON, so they have to be JSON-serializable.
- Every entry has a time-to-live. When it passes, the daemon removes the entry. A time-to-live of `0` means the entry stays until the daemon stops.
- Every call checks the uptime of the daemon, and if it's over [`maxUptime`](#-config), it restarts it, which empties the cache.
- When it's asked to stop (by `/in-memory-cache-stop`, a restart, or the uptime limit), the daemon writes `last-stop.json` in `<agent directory>/cache/in-memory-cache/`, with when it stopped, how long it ran, how many entries it had, its PID, and its memory. It never writes the values.

### 🧙 Config

This package uses [`@homer0/pi-config`](https://www.npmjs.com/package/@homer0/pi-config) to read its config, so it can go in a JSON or YAML file in your agent directory, or in your project directory. If you are not using `@homer0/pi-config` as an extension, assume it goes in a `config.yaml` file in your agent directory.

```yaml
extensions:
  inMemoryCache:
    maxUptime: 2h
```

| Option      | Default | What it does                                                                                                 |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `maxUptime` | `1h`    | How long the daemon can run before it's restarted. A number of milliseconds, or a string like `30m` or `2h`. |

### 🧰 Commands

| Command                    | What it does                                                   |
| -------------------------- | -------------------------------------------------------------- |
| `/in-memory-cache-status`  | Shows the uptime, entries, PID, memory, and CPU of the daemon. |
| `/in-memory-cache-stop`    | Stops the daemon.                                              |
| `/in-memory-cache-clean`   | Removes all the entries, and tells you how many there were.    |
| `/in-memory-cache-restart` | Restarts the daemon, or starts it if it was stopped.           |

### ⚙️ Examples

#### Caching something expensive

```ts
import { getCached } from '@homer0/pi-in-memory-cache';
import { z } from 'zod';

const tokenSchema = z.object({ token: z.string(), expiresIn: z.number() });

const token = await getCached({
  key: 'my-service:token',
  schema: tokenSchema,
  // Milliseconds, or a string with units. Use `0` for no expiry.
  ttl: '5m',
  // Only called when the key is not there.
  fetchFn: () => requestToken(),
});
```

The value is validated with the schema when it comes from the cache and when it comes from `fetchFn`, and the type of `token` comes from the schema. If what is in the cache doesn't match the schema, it's treated as a miss and fetched again.

The keys are shared by everything that uses the cache, so prefix them with something that identifies you, like in the example.

#### Reading and writing entries yourself

```ts
import { getEntry, removeEntry, setEntry } from '@homer0/pi-in-memory-cache';
import { z } from 'zod';

await setEntry({ key: 'my-service:last-run', value: { at: Date.now() }, ttl: '1h' });

const lastRun = await getEntry({
  key: 'my-service:last-run',
  schema: z.object({ at: z.number() }),
});

await removeEntry({ key: 'my-service:last-run' });
```

`getEntry` returns `undefined` if the key is missing, or if the value doesn't match the schema.

### 🤘 Development

As this project is part of a monorepo, some of the tooling, like `lint-staged` and `husky`, is installed in the root's `package.json`.

#### Tasks

| Task          | Description                     |
| ------------- | ------------------------------- |
| `build`       | Builds the package.             |
| `lint`        | Lints the package.              |
| `lint:file`   | Lints the files you send to it. |
| `test`        | Runs the unit tests.            |
| `types:check` | Validates the TypeScript types. |

## 📝 Motivation

Every now and then, when building an extension/tool/skill for my agent, I need to cache some data in a way that doesn't require writing to the file system or bringing a full-fledged service like Redis. So I built this small thing to work as KV storage in memory, with support for TTLs and schema validation and nothing else.
If at some point I need more features, it would mean that this package is no longer suitable for that scenario.
