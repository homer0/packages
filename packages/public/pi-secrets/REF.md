# Pi Package Reference

Source: ~/.pi/packages/pi-secrets
Source-Commit: 8fd4e61ab59333089f8b3e5add87c48fc8470043
Updated-At: 2026-10-28T06:17:33Z

## Copy Instructions

- Preserve the destination version controlled by Lerna. A new import starts with the initial source version. Use the packages repository URL and `packages/public/pi-secrets` directory, with public publishing provenance.

- Publish `dist/` and `src/`, excluding `src/**/*.test.ts`. Keep runtime ESM at `./dist/index.js`, main type entrypoints at `./src/index.ts`, and the package.json subpath. Retain the source tsdown build, `dts: false`, and `prepublishOnly`; do not generate declarations.

- Keep local runtime packages linked with `workspace:^` and development config packages with `workspace:*`. Resolve runtime catalogs to explicit ranges at each source commit. Use destination catalogs for shared development tooling; resolve source development catalogs explicitly when no destination entry exists. Use coverage-v8 rather than coverage-istanbul. Follow intentional upstream peer-dependency changes.

- Add the package to the root README and regenerate the destination lockfile without copying source resolutions. Preserve existing local workspace links, including pi-config's object-utils link; if installation switches one to a registry resolution, restore the link and remove unused registry entries, then verify with a frozen-lockfile install. Retain the five-day release-age policy and existing workspace settings.

- Preserve approved source style during replay rather than add unrelated refactors, including grouped exports, import ordering, existing type shapes, multi-parameter framework callbacks, and test setup. Apply the JS/TS checklist to adaptations.

- Resolve new runtime dependencies from the source catalog at each replayed commit, preserving exact pins when upstream requires them. Preserve local workspace links, existing compatibility overrides, and the destination release-age policy.

- The custom loader requires pi-config's public `resolvePiPath` export with `prefixedOnly`; import that prerequisite before this source change. Run loader tests with `TMPDIR=/tmp` to keep temporary fixtures in the approved temporary directory.
