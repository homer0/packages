# ⚓️ Root file

Import or require a file for the project root.

## 🍿 Usage

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

### 🤘 Development

As this project is part of the `packages` monorepo, it requires Yarn, and some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Yarn tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |
