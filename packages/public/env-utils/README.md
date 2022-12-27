# 🏠 Env utils

A really small service to centralize the place where you read and write environment variables, and check if you are running on development or production.

## 🍿 Usage

> - ⚠️ **This package is only for Node**.
> - If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

Let's say your code looks something like this:

```js
if (process.env.NODE_ENV !== 'production') {
  addSomeStuffForDevelopment();
}

console.log(`Hello ${process.env.NAME}`);
```

Let's implement the same but with `EnvUtils`:

```ts
import { envUtils } from '@homer0/env-utils';

const env = envUtils();

if (env.development) {
  addSomeStuffForDevelopment();
}

// The service allows you to set a default in case the variable is not defined.
const name = env.get('NAME', 'Rosario');
console.log(`Hello ${name}`);
```

Done! Now you are not manually checking for `NODE_ENV` and all your variables are being read on a single place.

#### Writing environment variables

Writing on the environment from inside an application is not that common as reading, but there are certain cases where this may come in handy.

Let's say you are using a library that has a _"debug mode"_ but the only way to enable it is using a environment variable, and for "purposes of debugging", you want to do it from your code:

```js
process.env.DEBUG_MY_LIBRARY = 'true';
runMyMagicLibrary();
```

Like for `get`, `set` also allows you to centralize where you overwrite your environment variables, but at the same time, it protects you from overwriting something that is already declared: Unless you tell `set` to overwrite declarations, if the variable already exists, it won't do it:

```ts
import { envUtils } from '@homer0/env-utils';

const env = envUtils();

// If you add a third parameter with `true`, it will overwrite any previous declaration.
const name = env.set('DEBUG_MY_LIBRARY', 'true');
runMyMagicLibrary();
```

Done! Now you are not manually updating the environment variable and potentially overwriting something that was already declared.

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `EnvUtils` as the `envUtils` service by using its provider:

```ts
import { envUtilsProvider } from '@homer0/env-utils';

// ...

container.register(envUtilsProvider);

// ...

const env = container.get('envUtils');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name:

```ts
container.register(
  envUtilsProvider({
    serviceName: 'myEnvUtils',
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

## Motivation

This used to be part of the [`wootils`](https://www.npmjs.com/package/wootils) package, my personal lib of utilities, but I decided to extract them into individual packages, as part of the `packages` monorepo, and take the oportunity to migrate them to TypeScript.

Is not uncommon nowadays for Node apps to be checking `NODE_ENV` and other environment variables in order to do or not to do certain things, and having multiple calls to `process.env` on different places of your app may not be a good idea: It's hard to track and maintain.
