# 💫 Extend promise

Extend a `Promise` by injecting custom properties using a `Proxy`. The custom properties will be available on the promise chain no matter how many `then`s, `catch`s or `finally`s are added.

## 🍿 Usage

> If you are wondering why I built this, go to the [Motivation](#motivation) section.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

> This function can be used with any kind of promises, but the example focuses on requests because, nowadays, they are the most common context for promises.

Let's say you have a function that makes a request and you want to be able to return a way to abort it at any point. You can use [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and
an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to do it, but you can't return just the promise, you need to return the controller, or at least its `abort` method:

```js
const makeTheRequest = () => {
  const controller = new AbortController();
  const req = fetch('https://...', {
    signal: controller.signal,
  });

  return { req, controller };
};
```

It looks good, but if the function is called from a service or somewhere that is not the actual implementation, you'll need to keep track of both the `Promise` and the `controller`.

You could _monkey patch_ the `abort` method to the `Promise`:

```js
const makeTheRequest = () => {
  const controller = new AbortController();
  const req = fetch('https://...', {
    signal: controller.signal,
  });
  req.abort = controller.abort.bind(this);
  return req;
};
```

But there's a problem: the moment a `.then`/`.catch`/`.finally` is added to that `Promise`, a new one is generated, and the patch goes away.

This is where `extend-promise` can help you: Either the `controller` or the `abort` method can be added to the chain and the customization will be available no matter how many `.then`s are added:

```js
import { extendPromise } from '@homer0/extend-promise';

const makeTheRequest = () => {
  const controller = new AbortController();
  const req = fetch('https://...', {
    signal: controller.signal,
  });

  return extendPromise(req, {
    abort: controller.abort.bind(this),
  });
};
```

And there you go! You can now receive the request `Promise` and abort it if needed:

```js
// Make the request
const req = makeTheRequest()
.then((response) => response.json())
.catch((error) => {
  if (error.name === 'AbortError') {
    console.log('to late...');
  }
  ...
});

// Abort it if takes more than one second.
setTimeout(() => req.abort(), 1000);
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

This used to be part of the [`wootils`](https://www.npmjs.com/package/wootils) package, my personal lib of utilities, but I decided to extract them into individual packages, as part of the `packages` monorepo, and take the oportunity to migrate them to TypeScript.

Now, the example in this same `README` is the reason I built it: I wanted the `AbortController` to be available on the `Promise` chain.
