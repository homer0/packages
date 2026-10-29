# Pi Package Reference

Source: ~/.pi/packages/pi-install-pnpm-package
Source-Commit: 6f6aeaa43a6b2e3946ad64c1bd9314f2772632cc
Updated-At: 2026-10-29T04:28:33Z

## Copy Instructions

- Preserve the destination version controlled by Lerna. A new import starts with the initial source version. Use the packages repository URL and `packages/public/pi-install-pnpm-package` directory, with public publishing provenance.

- This is an extension-only package. Publish `dist/` and `src/`, excluding `src/**/*.test.ts`, and point `pi.extensions` to the built `dist/install-pnpm-package.js` entry. Keep the source tsdown build, `dts: false`, and `prepublishOnly`; do not add a library entrypoint or generate declarations.

- Resolve runtime catalogs to explicit ranges at each source commit. Use `workspace:*` for local development config packages and destination catalogs for shared development tooling. Use coverage-v8 rather than coverage-istanbul. Follow intentional upstream peer-dependency changes.

- Add the package to the root README and regenerate the destination lockfile without copying source resolutions. Preserve existing local workspace links; if installation switches one to a registry resolution, restore the link and remove unused registry entries, then verify with a frozen-lockfile install. Retain the destination release-age policy and compatibility overrides.

- Preserve approved upstream code and style during replay, including import ordering, type assertions, module-scope test types, and existing error handling. Apply the JS/TS checklist to integration adaptations.
