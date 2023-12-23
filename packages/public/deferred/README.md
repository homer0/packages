# 🕗 Deferred

Small utility to create a deferred promise

## 🍿 Usage

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

Using it is really simple, you call the `deferred()` function and get an object with `promise`, `resolve` and `reject`. You return the `promise` property and, eventually, call `resolve` or `reject` to either resolve the promise or reject it.

Now, a reason to use this is for when you have another service/function/something asking for something that your code hasn't even started to do:

```ts
import * as fs from 'fs/promises';
import { deferred, type DeferredPromise } from '@homer0/deferred';

class MyServiceThatLoadsAfile {
  private defer: DeferredPromise<string>;
  private file: string;

  constructor() {
    this.defer = deferred();
  }

  getFileContents(): Promise<string> {
    if (this.file) return Promise.resolve(this.file);
    return this.defer.promise;
  }

  async loadTheFile(): Promise<void> {
    try {
      this.file = await fs.readFile('some-path', 'utf-8');
      this.defer.resolve(this.file);
    } catch (err) {
      this.defer.reject(err);
    }
  }
}

const myService = new MyServiceThatLoadsAfile();
myService.getFileContents().then((contents) => {
  console.log('GOT IT', contents);
});

// ...
myService.loadTheFile();
```

Ok, there's a lot going on this example, so let's break it:

1. `MyServiceThatLoadsAFile` creates a deferred promise on its constructor.
2. `getFileContents` should return the file contents, but because the file is not loaded yet (as `loadTheFile` has not been called), it returns the deferred promise.
3. Eventually, `loadTheFile` gets called, it loads the file and either resolves or rejects the deferred promise, so the `getFileContents().then(...)` (or `catch` :P) gets finally called.

I wanted to keep the example small, but on a real app, `getFileContents` is probably called by other service that has no idea the instance was just created or that `loadTheFile` hasn't been called yet.

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like `lint-staged` and `husky`, are installed on the root's `package.json`.

#### Tasks

| Task          | Description                         |
| ------------- | ----------------------------------- |
| `lint`        | Lints the package.                  |
| `test`        | Runs the unit tests.                |
| `build`       | Transpiles and bundles the project. |
| `types:check` | Validates the TypeScript types.     |
