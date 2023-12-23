# ☢️ TS Async Import

A wrapper to do dynamic imports in TypeScript contexts that target CommonJS.

## 🍿 Usage

> ⚠️ **Don't use this package if you are targeting ES modules**.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Examples

```ts
import { tsAsyncImport } from '@homer0/ts-async-import';

// ...

const { default: nodeFetch } =
  await tsAsyncImport<typeof import('node-fetch')>('node-fetch');
```

That's it, the only difference between this and a regular `import` is that you need to specify the type of the module you are importing.

And, if for some reason, you want to specify the context path for the import, you can do it with the second parameter:

```ts
import { tsAsyncImport } from '@homer0/ts-async-import';

// ...

const { default: nodeFetch } = await tsAsyncImport<typeof import('node-fetch')>(
  'node-fetch',
  __dirname,
);
```

### 🤘 Development

As this project is part of the `packages` monorepo, some of the tooling, like `lint-staged` and `husky`, are installed on the root's `package.json`.

#### Tasks

| Task          | Description                     |
| ------------- | ------------------------------- |
| `lint`        | Lints the package.              |
| `test`        | Runs the unit tests.            |
| `types:check` | Validates the TypeScript types. |

## Motivation

I didn't want to have to change my `tsconfig.json` just to prevent TS to transform the two `import`s I have into `require`s 🤬.
