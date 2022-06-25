# 💥 Error handler

Listens for uncaught exceptions and unhandled promises rejections, and logs them out with full detail.

By default, if an error is thrown, node will just output the error, but if a `Promise` is rejected and there's no `catch` to capture the exception, it will log `...`, which doesn't provide a lot of information, right?

Well, `ErrorHandler` listens for these kind of exceptions, unhandled errors and rejected promises, and logs them with their stack trace information using the `Logger` utility.

## 🍿 Usage

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Example

```ts
import { errorHandler } from '@homer0/error-handler';

const handler = errorHandler();

// ...

handler.listen();
```

Now, if something like an API call without a `catch` would throw an error, you'll see the error logged like this:

```bash
[2018-01-22 04:19:12] 401
at makeAPICall (/path-to-your-app/index.js:9:42)
at Object.<anonymous> (/path-to-your-app/index.js:11:1)
at Module._compile (module.js:570:32)
at Object.Module._extensions..js (module.js:579:10)
at Module.load (module.js:487:32)
at tryModuleLoad (module.js:446:12)
at Function.Module._load (module.js:438:3)
at Module.runMain (module.js:604:10)
at run (bootstrap_node.js:383:7)
at startup (bootstrap_node.js:149:9)
```

Date an time, and full stack trace information (with colors!).

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `ErrorHandler` as the `errorHandler` service by using its provider:

```ts
import { errorHandlerProvider } from '@homer0/error-handler';

// ...

container.register(errorHandlerProvider);

// ...

const handler = container.get('errorHandler');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name:

```ts
container.register(
  errorHandlerProvider({
    serviceName: 'myErrorHandler',
  }),
);
```

##### Dependencies

`ErrorHandler` depends on the following services, and when used with Jimple, it will try to find them in the container, otherwise, it will create new instances:

- [`@homer0/simple-logger`](https://npmjs.com/package/@homer0/simple-logger), with the name `appLogger` or `simpleLogger`. Used to generate log the messages in the console.

If you already implement the dependencies, but with a different name, you can specify them in the provider:

```ts
container.register(
  errorHandlerProvider({
    services: {
      simpleLogger: 'mySimpleLogger',
      // or `appLogger: 'myAppLogger',`
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
