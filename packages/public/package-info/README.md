# 📦 Package info

A tiny service that reads the contents of the project's `package.json`, sync & async.

## 🍿 Usage

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

### 🤘 Development

As this project is part of the `packages` monorepo, it requires Yarn, and some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Yarn tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |
