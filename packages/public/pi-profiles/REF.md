# Pi Package Reference

Source: ~/.pi/packages/pi-profiles
Source-Commit: 1cf61dc1a48edda451cb2fb5009f8de260b700ea
Updated-At: 2026-10-30T04:32:00Z

## Copy Instructions

- Preserve the destination version (controlled by Lerna), packages repository URL and directory, and public publishing provenance.

- Publish `dist/` and `src/`, excluding `src/**/*.test.ts`. Keep runtime ESM exports and the Pi extension entrypoint in `dist/`, with both type entrypoints at `./src/index.ts`. Build `src/index.ts` and `src/extensions/profiles.ts` with tsdown, keep `dts: false` and `prepublishOnly`, and do not generate declarations. The destination build is present from the initial replay; reconcile later source build additions without restoring TypeScript runtime entrypoints.

- Keep the public `@homer0/pi-config` runtime dependency as `workspace:^`. Resolve runtime `jiti` and `zod` catalogs to explicit versions at each source commit. Use destination catalogs for Pi and shared development tooling, `workspace:*` for local development config packages, and coverage-v8 rather than source coverage-istanbul.

- Keep colocated tests and the `@tests` fixture alias. Include the destination tsdown config in type checks. Publish no test fixtures.

- Integrate the public package in the root `README.md` and regenerate `pnpm-lock.yaml`, retaining the five-day release-age policy and existing workspace overrides and build permissions.

- Source commit `74193af20b1683c40e9dbdb9887a023f5bca7ccb` sets the Pi peer range to `>1.0.0` (excluding 1.0.0). Preserve it for that source commit, but follow intentional upstream range changes in future replays. Its runtime catalogs resolve `jiti` to 2.7.0 and Zod to 4.6.7.

- During the initial import, historical Zod 4.6.5 dependencies coincided with a TypeScript heap exhaustion. After replaying the final commit, reinstalling with Zod 4.6.7, and deduplicating the dependency graph, the normal type check passed without source changes or a larger heap. Revalidate type checks on the fully replayed dependency graph; do not add type shims or enable declaration generation as a workaround.

- Preserve approved source style during replay rather than add unrelated refactors, including source import ordering, module-scope shared test helpers and hoisted mocks, existing comments, and type shapes. Apply the JS/TS checklist to adaptations.
