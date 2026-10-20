# Pi Package Reference

Source: ~/.pi/packages/pi-config
Source-Commit: 72e2a5072a0f36509b22e6bcc4d054fe40925573
Updated-At: 2026-10-20T02:26:29Z

## Copy Instructions

- Preserve destination version (controlled by Lerna) and packages repository metadata, with public publishing provenance.

- Publish `dist/` and `src/`, excluding `src/**/*.test.ts`. Keep runtime ESM exports and the Pi extension entrypoint in `dist/`, but point both package type entrypoints to `./src/index.ts`. Build both runtime entrypoints with tsdown, keep dts: false and prepublishOnly, and do not generate declarations.

- Resolve runtime catalog dependencies from the catalog at each source commit to explicit ranges. Use `workspace:*` for local development config packages, destination catalogs for shared tooling, and explicit source-catalog Pi development versions when no destination catalog entry exists.

- Use destination Vitest and coverage-v8 catalogs instead of source coverage-istanbul. Keep colocated tests and their source behavior. Keep package self-imports resolving to `src/index.ts` for module augmentation type checks.

- Keep the workspace's five-day minimum release age. Pin `@aws-sdk/token-providers` to `3.1149.0` while newer SSO metadata requires an unpublished version. Pin `pi-coding-agent@1.1.0`'s `pi-codemode` dependency to `1.1.0` to preserve its expected declarations. Reassess these temporary overrides when updating Pi.

- Match source build permissions for Pi dependencies: `@google/genai: false` (no-op preinstall) and `protobufjs: true` (version validation). pnpm may insert permission placeholders on failed installs; remove those placeholders when adding explicit decisions.

- Add the public package to the root `README` and regenerate `pnpm-lock.yaml`. pnpm also deduplicates the optional `jiti` peer to `2.7.0` across existing lockfile snapshots; no sibling manifests change.

- Source commit `72e2a5072a0f36509b22e6bcc4d054fe40925573` uses `>1.0.0` for both Pi peer dependencies; preserve that exact range for this source commit (it excludes `1.0.0`), but follow intentional upstream range changes in future replays. Its catalogs resolve Pi development dependencies to `1.2.0` and Zod to `4.6.7`. The retained Pi `1.1.0`-specific `pi-codemode` override is now inactive. pnpm also deduplicates ignore from `7.0.6` to the existing `7.0.8` resolution.

- Preserve approved source style during replay, including grouped exports, multi-parameter helpers, direct undefined comparisons, import ordering, and hoisted module-scope Vitest setup. Limit edits to integration/build adaptations unless a source change requires reconciliation.
