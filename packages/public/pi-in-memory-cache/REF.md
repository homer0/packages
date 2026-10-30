# Pi Package Reference

Source: ~/.pi/packages/pi-in-memory-cache
Source-Commit: 5113d68e0cdc9c1252524b0196a6be9425de3b1e
Updated-At: 2026-10-30T04:31:38Z

## Copy Instructions

- Preserve the destination version (controlled by Lerna); the initial source version is `1.0.0`. Use the packages repository URL and `packages/public/pi-in-memory-cache` directory, with public publishing provenance.

- Publish `dist/` and `src/`, excluding `src/**/*.test.ts`. Use `./dist/index.js` for runtime ESM and `./src/index.ts` for both main type entrypoints. Keep the package.json subpath and the Pi extension at `./dist/extensions/in-memory-cache.js`. Build the library, daemon, and extension with the source tsdown configuration, retaining `dts: false` and `prepublishOnly`.

- Keep local runtime dependencies linked with `workspace:^` and development config packages with `workspace:*`. Resolve runtime catalogs to explicit ranges at each source commit. Use destination catalogs for Pi and shared development tooling; when no destination catalog entry exists, resolve the source catalog to an explicit range. Use coverage-v8 rather than source coverage-istanbul, and follow intentional upstream peer-range changes.

- Add the package to the root README and regenerate the destination lockfile without copying source resolutions. Preserve local workspace links, including pi-config's object-utils link. The initial install switched that existing link to a registry resolution; restore it, remove the unneeded registry entries, and verify with a frozen-lockfile install. Keep the five-day release-age policy and existing workspace settings.

- Preserve approved source style during replay rather than add unrelated refactors, including grouped exports, import ordering, multiline single-line comments, module-scope test helpers, and existing type shapes. Apply the JS/TS checklist to adaptations.

- Keep the source jiti resolution helper unchanged, as explicitly requested. Initial validation passed 122 tests, type checking, lint, formatting, and build. A built-client daemon smoke check could not start the daemon in this workspace: the helper assumes a root node_modules/.bin/jiti, while only the package-local binary exists. Mocked lifecycle tests do not cover that installation-layout limitation. Do not silently change the helper or add a root dependency to work around it.
