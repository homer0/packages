# @homer0/oxlint-config

Reusable [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) configuration factories.

## Installation

```bash
pnpm add --save-dev @homer0/oxlint-config oxlint
```

## Requirements

| Package | Version    | Notes |
| ------- | ---------- | ----- |
| Node.js | `>=22`     |       |
| Oxlint  | `>=1.77.0` |       |

## Configuration

Create an `oxlint.config.ts` file and export one composed config.

### Node and TypeScript

```ts
import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  env: 'node',
  tests: 'directory',
});
```

`env` selects one environment: `node` or `browser`. Native TypeScript policy is enabled by default; set `ts: false` to disable it. It does not enable type-aware rules or require the TypeScript compiler.

### Browser

```ts
import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  env: 'browser',
});
```

### React

Use `createConfig` and send the `react` option to add React, JSX accessibility, and React-performance rules.

```ts
import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  env: 'browser',
  react: true,
});
```

### Tests

| `tests` value      | Matching files                                | Environment and TypeScript policy                                                 |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Omitted or `false` | None                                          | No test override.                                                                 |
| `true`             | Both `*.test`/`*.spec` files and `tests/**`   | Uses production settings and Vitest rules.                                        |
| `'colocated'`      | `*.test` and `*.spec` files                   | Uses production settings and Vitest rules.                                        |
| `'directory'`      | `tests/**`                                    | Uses production settings and Vitest rules.                                        |
| Object             | Built-in `files` convention or custom glob(s) | Uses custom `env` and `ts`, or production settings by default, with Vitest rules. |

A browser project can use Node TypeScript policy for its tests without changing production rules:

```ts
import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  env: 'browser',
  tests: {
    env: 'node',
    files: 'directory',
  },
});
```

### Globals

Use `globals` to add named globals or `$`-prefixed global groups from the [`globals`](https://www.npmjs.com/package/globals) package. Named globals use Oxlint's `'readonly'`, `'writable'`, or `'off'` modes; `true` makes a named global writable. Groups use `true`. Added globals also apply to generated test overrides.

```ts
export default createConfig({
  env: 'node',
  globals: {
    $browser: true,
    __piMcpState: 'readonly',
  },
  tests: 'directory',
});
```

### Allowed dangling underscores

Use `allowedDangleNames` to add exact identifiers to the base `no-underscore-dangle` allow-list. The built-in `__` entry remains allowed, and added names also apply to generated test overrides.

```ts
export default createConfig({
  allowedDangleNames: ['__piMcpState'],
  env: 'node',
});
```

### JSDoc

Set `jsdoc: true` to opt into Oxlint's native JSDoc subset. It covers JSDoc access, tag, parameter, property, and return declarations; rules without a native equivalent remain omitted.

```ts
export default createConfig({
  env: 'node',
  jsdoc: true,
  ts: true,
});
```

### Next.js

Use `createNextjsConfig` for a Node, TypeScript, and React configuration with native Next.js recommended and Core Web Vitals rules. It ignores Next.js build output by default.

```ts
import { createNextjsConfig } from '@homer0/oxlint-config';

export default createNextjsConfig({
  jsdoc: true,
  tests: 'directory',
});
```

### Type-aware linting

`typeAware` is a root-only option, disabled by default. It enables Oxlint type-aware mode and checks deprecated APIs, floating promises, and Promises used in synchronous contexts. It requires the optional `oxlint-tsgolint` peer dependency and TypeScript 7 or newer:

```bash
pnpm add --save-dev oxlint-tsgolint typescript
```

```ts
export default createConfig({
  env: 'node',
  ts: true,
  typeAware: true,
});
```

### Extensions

Use `extensions` to add supported native rule settings without manually merging policy maps. Available fragment names are `base`, `browser`, `jsdoc`, `node`, `typescript`, `tests`, and `react`.

```ts
createConfig({
  env: 'node',
  extensions: {
    typescript: {
      rules: {
        'typescript/no-unused-vars': 'warn',
      },
    },
  },
  ts: true,
});
```

`extensionFragments` is exported for callers that need to inspect the supported native fragments.

## Formatter compatibility

This package does not install, configure, or run a formatter. Formatting remains external. The base policy disables `curly` and `no-unexpected-multiline` because formatter output may conflict with them.

## Rule differences

See [rule differences](./docs/rule-differences.md) for native equivalents, intentional omissions, and formatter compatibility decisions.

## Development

```bash
pnpm run build
pnpm run lint
pnpm run test
pnpm run types:check
```
