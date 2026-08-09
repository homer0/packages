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

The package provides rule fragments for `node`, `browser`, TypeScript, tests, and React. Configuration factories are added separately.

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
