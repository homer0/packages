# @homer0/oxfmt-config

Reusable [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) configuration.

## Installation

```bash
pnpm add --save-dev @homer0/oxfmt-config oxfmt
```

## Configuration

The default export applies the shared formatting style, native JSDoc formatting, import sorting, and ignores coverage, build, and dependency directories. Import sorting keeps built-in, external, internal, and Node subpath imports together before relative imports, without adding blank lines between groups.

```ts
import config from '@homer0/oxfmt-config';

export default config;
```

Use `createConfig` to customize the shared configuration:

```ts
import { createConfig } from '@homer0/oxfmt-config';

export default createConfig({
  ignores: ['generated/**'],
  jsdoc: false,
  sortPackageJson: true,
});
```

`overrides` accepts Oxfmt configuration options and applies them after the shared settings, feature defaults, and combined ignore patterns.

```ts
import { createConfig } from '@homer0/oxfmt-config';

export default createConfig({
  overrides: {
    printWidth: 100,
    quoteProps: 'preserve',
  },
});
```

For project-specific file overrides, compose the returned configuration in your `oxfmt.config.ts` file:

```ts
import { createConfig } from '@homer0/oxfmt-config';

const config = createConfig();

export default {
  ...config,
  overrides: [
    {
      files: ['*.md'],
      options: { proseWrap: 'always' },
    },
  ],
};
```

## JSON export

`@homer0/oxfmt-config/json` exports a JSON file generated from `createConfig()`. It is intended for future use if Oxfmt adds support for extending shared JSON configurations.

## Development

```bash
pnpm run build
pnpm run lint
pnpm run test
pnpm run types:check
```
