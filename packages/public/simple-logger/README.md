# 💬 Simple logger

A small service to log messages in the console.

## 🍿 Usage

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Example

#### Logging messages

```ts
import { simpleLogger } from '@homer0/simple-logger';

const logger = simpleLogger();

logger.log('Starting the app');
// Will log the message the same way `console.log` would.

if (usingExperimentalFeature()) {
  logger.warn('WARNING: This feature is experimental');
  // Will log a yellow message.
}

if (onDevelopment()) {
  logger.info('Running on a development environment');
  // Will log a gray message.
}

if (loadConfiguration()) {
  logger.success('The configuration was successfully loaded');
  // Will log a green message
}

try {
  methodThatMayThrowAnError();
} catch (error) {
  logger.error('Damn it!', error);
  // Will log `Damn it!` on red, and the `error` stack trace information on `gray`.
}
```

#### Colored messages

This was demonstrated on the example above:

1. `success(message)` will log a green message.
2. `warn(message)` will log a yellow message.
3. `error(message)` will log a red message.
4. `info(message)` will log a gray message.

But they all depend on this method: `log(message, color)`; it allows you to specify one of the colors available on the [`colors`](https://npmjs.com/package/colors) package.

By default, it uses the console default text color, but you can specify a different color for the message.

```ts
logger.log('Starting the app', 'green');
```

#### Multiple messages at once

All the methods support both a single message or an `Array` of them:

```ts
logger.info(['App running', 'connection detected', 'starting Skynet...']);
// This will log three gray messages.
```

You can even specify a color for each message:

```ts
logger.success([
  'It works!',
  ['wait, something is happening', 'gray'],
  'Nevermind, Skynet is up and running!',
]);
// This will log the first and third message on green and the second one on gray.
```

#### Prefixing the messages

When creating the logger, you can specify a `prefix` option that will be prepended to each message.

```ts
const logger = simpleLogger({ prefix: 'my-app' });
logger.log('Starting the app');
// Will log `[my-app] Starting the app`
```

#### Date and time

The same way you can specify the prefix when creating the logger, you also have a `showTime` option that will make the logger show the current date and time on each message.

```ts
const logger = simpleLogger({ showTime: true });
logger.log('Starting the app');
// Will log something like `[2022-06-25 19:41:11] Starting the app`
```

> Yes, you can use both `prefix` and `showTime` together.

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `SimpleLogger` as the `simpleLogger` service by using its provider:

```ts
import { simpleLoggerProvider } from '@homer0/simple-logger';

// ...

container.register(simpleLoggerProvider);

// ...

const logger = container.get('simpleLogger');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name:

```ts
constainer.register(
  simpleLoggerProvider({
    serviceName: 'myLogger',
  }),
);
```

#### App logger provider

The package has an alternative service provider for Jimple that gets the project name from the `package.json` and uses as the prefix:

```ts
import { appLoggerProvider } from '@homer0/simple-logger';

// ...

container.register(appLoggerProvider);

// ...

const logger = container.get('appLogger');
logger.log('Starting the app');
// Will log `[my-app] Starting the app`, where `my-app` is the `name` in
// your package.json
```

You can also specify a `appLoggerPrefix` on your `package.json`, and it will use that instead of the `name`.

### 🤘 Development

As this project is part of the `packages` monorepo, it requires Yarn, and some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Yarn tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |
