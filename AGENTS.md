# Project Agent Instructions

## Quick context

- This is a pnpm workspace monorepo for unrelated personal Node packages, split between `packages/public/*` and `packages/personal/*`.
- Releases are managed independently with Lerna; package publication/versioning is restricted to the `main` branch.
- Use Node.js 22 or newer and pnpm 11.9.0, as declared in the root manifest.

## Project-specific gotchas

- Root ESLint intentionally ignores `packages/**`; package linting is run through Lerna.
- `pnpm lint` runs `lint-staged`, so it only checks staged files. Use `pnpm lint:all` to lint the whole repository and all packages.
- Tests, builds, and type checks are delegated to package scripts through Lerna. Pass package scopes and package-specific arguments through the wrapper as documented in `README.md`.
- The workspace enforces a five-day minimum release age for external dependencies, except `@homer0/*` packages.

## Commands that matter

- `pnpm build` — run every package build through Lerna.
- `pnpm test` — run every package test; use `pnpm test --scope <package>` for one package. Pass package test arguments after `--`, for example `pnpm test --scope <package> -- --coverage`.
- `pnpm types:check` — run package type checks through Lerna.
- `pnpm lint:all` — lint root files and every package.

## Conventions that are easy to miss

- Use two-space indentation, LF endings, UTF-8, and final newlines. Markdown trailing whitespace is preserved.
- Follow Conventional Commits. Use `monorepo` or the package name as the scope. For breaking changes, use a `BREAKING CHANGES:` footer rather than `!`.

## Safety rules

- Never run Lerna versioning or publishing commands; releases are executed in CI.
