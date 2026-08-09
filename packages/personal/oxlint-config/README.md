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
  configs: ['node'],
  tests: 'directory',
  ts: true,
});
```

`configs` accepts exactly one environment: `node` or `browser`. Set `ts: true` to apply the native TypeScript policy to TypeScript files. It does not enable type-aware rules or require the TypeScript compiler.

### Browser

```ts
import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  configs: ['browser'],
  ts: true,
});
```

### React

Use `createReactConfig` with the same options to add React and JSX accessibility rules.

```ts
import { createReactConfig } from '@homer0/oxlint-config';

export default createReactConfig({
  configs: ['browser'],
  tests: 'colocated',
  ts: true,
});
```

### Tests

| `tests` value      | Matching files                              | Environment and TypeScript policy                                  |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------------ |
| Omitted or `false` | None                                        | No test override.                                                  |
| `true`             | Both `*.test`/`*.spec` files and `tests/**` | Uses production settings.                                          |
| `'colocated'`      | `*.test` and `*.spec` files                 | Uses production settings.                                          |
| `'directory'`      | `tests/**`                                  | Uses production settings.                                          |
| Object             | Custom `files` glob or globs                | Uses custom `configs` and `ts`, or production settings by default. |

A browser project can use Node TypeScript policy for its tests without changing production rules:

```ts
import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  configs: ['browser'],
  tests: {
    configs: ['node'],
    files: 'tests/**/*.ts',
    ts: true,
  },
  ts: true,
});
```

### JSDoc

Set `jsdoc: true` to opt into Oxlint's native JSDoc subset. It covers JSDoc access, tag, parameter, property, and return declarations; rules without a native equivalent remain omitted.

```ts
export default createConfig({
  configs: ['node'],
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

`typeAware` is a root-only option, disabled by default. It enables Oxlint type-aware mode for the complete config, not only TypeScript overrides. It requires the optional `oxlint-tsgolint` peer dependency and TypeScript 7 or newer:

```bash
pnpm add --save-dev oxlint-tsgolint typescript
```

```ts
export default createConfig({
  configs: ['node'],
  ts: true,
  typeAware: true,
});
```

### Extensions

Use `extensions` to add supported native rule settings without manually merging policy maps. Available fragment names are `base`, `browser`, `jsdoc`, `node`, `typescript`, `tests`, and `react`.

```ts
createConfig({
  configs: ['node'],
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
