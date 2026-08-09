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

Create one composed config with `createConfig`:

```ts
import { createConfig } from '@homer0/oxlint-config';

export default createConfig({
  configs: ['node'],
  tests: 'directory',
  ts: true,
});
```

`configs` accepts exactly one environment: `node` or `browser`. Set `ts: true` to apply the native TypeScript policy. `tests` may be omitted, `false`, `true` (both conventions), `'colocated'`, `'directory'`, or a custom override:

```ts
createConfig({
  configs: ['browser'],
  tests: {
    configs: ['node'],
    files: 'tests/**/*.ts',
    ts: true,
  },
  ts: true,
});
```

This keeps browser production policy separate from Node-based test policy. Use `createReactConfig` with the same options to add React and JSX accessibility rules.

Use `extensions` to add supported native rule settings without manually merging policy maps:

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

`typeAware` is a root-only factory option. It is disabled by default. Enabling it requires installing the optional `oxlint-tsgolint` peer dependency and TypeScript 7 or newer:

```bash
pnpm add --save-dev oxlint-tsgolint typescript
```

## Formatter compatibility

This package does not install, configure, or run a formatter. Its base policy disables rules that conflict with formatter output.

See [rule differences](./docs/rule-differences.md) for the current policy and omitted rules.

## Development

```bash
pnpm run build
pnpm run test
pnpm run types:check
```
