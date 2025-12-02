# @homer0/eslint-plugin

My custom configurations for ESLint

## Installation

```bash
pnpm add @homer0/eslint-plugin --save-dev
# or
npm install @homer0/eslint-plugin --save-dev
```

## Requirements

| Package    | Minimum Version and notes                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Node       | `>=20.19`                                                                                                                 |
| ESLint     | `>=9.39.1` - with **[flat config](https://eslint.org/docs/latest/use/configure/configuration-files)**                     |
| TypeScript | `>=5` - with **[ESM](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-node18-node20-nodenext)** |

## Usage

Import the plugin in your ESLint config, and add it to the `extends` list:

```js
// eslint.config.js
import { defineConfig } from 'eslint/config';
import eslintPlugin from '@homer0/eslint-plugin';

export default defineConfig([
  files: ['src/**/*.ts'],
  extends: [
    eslintPlugin.configs.node,
    eslintPlugin.configs.esm,
  ],
]);
```

Or, you can _create_ a config with your desired presets:

```js
// eslint.config.js
import { defineConfig } from 'eslint/config';
import { createConfig } from '@homer0/eslint-plugin/create';

export default defineConfig([
  createConfig({
    importUrl: import.meta.url, // to configure TS paths resolution
    extends: ['node-ts-with-prettier'],
  }),
]);
```

## Configurations

Originally, all configurations were based on Airbnb's base config, with some customizations on top of it. But now, since Airbnb hasn't published a flat config version yet (as of November 2025), I added an `airbnb` folder inside the project and copied their rules (except for the deprecated ones), in flat config format.

The airbnb folder is temporary (I think), as I eventually plan to review all the rules and create my own base config from scratch.

So, for now, my configs are still based on Airbnb's base rules, with some customization, minus the rules that are deprecated or moved to the stylistic plugin (as I leave all my formatting to [Prettier](https://prettier.io)).

Now, there are three main types of configurations:

- **environment**-specific: They are meant to be used as a base for your projects, like `node` or `browser`.
- **feature**-specific: They are meant to be added on top of those base configs, like `esm`, `jsdoc`, and/or `testing`.
- **combined**: To cover the most common cases, these features combine both environment and features, like `node-ts`, and `node-ts-testing`.

Environment and combined configurations include a _[Prettier](https://prettier.io) version_ with the suffix `-with-prettier`. They add the Prettier's config that takes care of disabling all the ESLint rules that may conflict with Prettier's formatting.

| Name            | Type        | Description                                                                                                                                                                                                                                                                                                                                     | Prettier version |
| --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `browser`       | environment | For browser-based projects; it's like the one for node, but with the browser globals and without the `eslint-plugin-n`.                                                                                                                                                                                                                         | ✅               |
| `node`          | environment | For Node.js and the tooling outside browser-based projects. It uses the [`eslint-plugin-n`](https://www.npmjs.com/package/eslint-plugin-n)'s recommended config.                                                                                                                                                                                | ✅               |
| `node-ts`       | combined    | For Node.js projects using TypeScript; it extends the `node` config and adds TypeScript support.                                                                                                                                                                                                                                                | ✅               |
| `node-ts-tests` | combined    | Extends `node-ts` and disables a few rules for acceptable scenarios in testing environments (like `no-magic-numbers`).                                                                                                                                                                                                                          | ✅               |
| `tests`         | feature     | It disables a few rules for acceptable scenarios in testing environments (like `no-magic-numbers`).                                                                                                                                                                                                                                             | ❌               |
| `esm`           | feature     | For projects using ESM modules; it sets the `sourceType` to `module` and customizes a few rules accordingly (mostly around the [`eslint-plugin-import-x`](https://www.npmjs.com/package/eslint-plugin-import-x)). **Important:** Don't use this config with a TypeScript based config, just leave the extensions validation to the TS compiler. | ❌               |
| `ts`            | feature     | For TypeScript projects; it adds TypeScript support on top of any other config.                                                                                                                                                                                                                                                                 | ❌               |
| `jsdoc`         | feature     | For projects using JSDoc comments; it adds rules from the [`eslint-plugin-jsdoc`](https://www.npmjs.com/package/eslint-plugin-jsdoc).                                                                                                                                                                                                           | ❌               |

## Frameworks and libraries

Here are a few special configs and tools for specific frameworks and libraries **I use**.

### Next.js

If you are working on a [Next.js](https://nextjs.org) project, there's a custom export and config creator for it, but it requires you to install their config:

```bash
pnpm add eslint-config-next --save-dev
# or
npm install eslint-config-next --save-dev
```

Then, you can import the plugin in your config and use it like this:

```js
// eslint.config.js
import { defineConfig } from 'eslint/config';
import eslintPlugin from '@homer0/eslint-plugin/nextjs';

export default defineConfig([
  files: ['src/**/*.ts'],
  extends: [
    eslintPlugin.configs['nextjs-with-prettier'],
  ],
]);
```

> Yes, it has a Prettier version too!

Or, like with the other configs, you can use a config creator:

```js
// eslint.config.js
import { defineConfig } from 'eslint/config';
import { createNextjsConfig } from '@homer0/eslint-plugin/nextjs/create';

export default defineConfig([
  createNextjsConfig({
    importUrl: import.meta.url, // to configure TS paths resolution
    // These are the options and their default values:
    prettier: true,
  }),
]);
```

### React

If you are working with just [React](https://reactjs.org) (no Next), there's also a custom export and config creator for it, and it also requires some plugins to be installed:

```bash
pnpm add eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y --save-dev
# or
npm install eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y --save-dev
```

But different from the Next.js config, this is not a base config, so you'd have to use it on top of another config, like `node-ts` or `browser`.

```js
// eslint.config.js
import { defineConfig } from 'eslint/config';
import plugin from '@homer0/eslint-plugin';
import reactPlugin from '@homer0/eslint-plugin/react';

export default defineConfig([
  files: ['src/**/*.ts'],
  extends: [
    eslintPlugin.configs['node-with-prettier'],
    reactPlugin.configs.react,
    eslintPlugin.configs.esm.
  ],
]);
```

Or, you can use the config creator:

```js
// eslint.config.js
import { defineConfig } from 'eslint/config';
import { createReactConfig } from '@homer0/eslint-plugin/react/create';

export default defineConfig([
  createReactConfig({
    importUrl: import.meta.url, // to configure TS paths resolution
    baseConfig: 'node', // 'node' | 'browser', default is 'node'
    // These are the options and their default values:
    esm: true,
    jsdoc: false,
    prettier: true,
    tests: false,
    ts: true,
  }),
]);
```

## Config creator features

When using the config creators (like `createConfig` or `createNextjsConfig`), you get a few extra features besides the TS path resolution setup.

### `files`: Files inclusion

While this option behaves similarly to ESLint's native `files` option, it has some extra capabilities to make your life easier. You can set the values to:

- A glob pattern string (like `src/**/*.ts`).
- `all` to include all JS/TS files in your project (basically, it resolves to `**/*.{js,jsx,the-rest}`).
- `all-inside:<path>` to include all JS/TS files inside a specific folder (like `all-inside:src` resolves to `src/**/*.{js,jsx,the-rest}`).

And you can send an array of those values too.

### Custom tsconfig.json

There are two options for working with custom `tsconfig.json` files:

- `tsConfigName`: If your `tsconfig.json` file has a different name (like `tsconfig.app.json`), you can specify it here. Default is `tsconfig.json`.
- `tsConfigPath`: If your `tsconfig.json` file is not in the root folder, you can specify its path here. Default is `./` (the root folder).

Those are two different options because you normally have either a custom name on the root, like `tsconfig.production.json`, or a custom path, like `tests/tsconfig.json`.

### Extraneous dependencies

The `no-extraneous-dependencies` rule from [`eslint-plugin-import-x`](https://www.npmjs.com/package/eslint-plugin-import-x) (and previously the original `eslint-plugin-import`) is very useful to avoid importing packages that are not listed in your `package.json` dependencies... but it's always a pain to configure properly, and when you are bundling, it's very common to just disable it altogether.

So, with the config creators, you can use the `extraneousDependencies` option to easily configure it according to your situation. The option is an object with the following keys:

- `devFiles`: An array of glob patterns for files that are considered development files that are allowed to import `devDependencies`. By default, it includes a big list, from the airbnb config, of all major JS/TS tools config files (like `webpack.config.js`, `jest.config.ts`, etc).
- `bundledDependencies`: A list of packages paths that are bundled in your project's build process. For example, if you are bundling `urijs` in your build, you can add it here, and the rule will allow importing it without listing it in your `dependencies`.

### Ignore files

With the new flat config, `.eslintignore` files are not supported anymore, and you now need a [workaround](https://eslint.org/docs/latest/use/configure/ignore#including-gitignore-files) to load the patterns from those files into your config.

Built into the config creators is a feature that automatically loads `.eslintignore` and/or `.gitignore` patterns into your config, so you don't have to worry about it.

By default, the feature will crawl upwards from your config file location until it finds a `.gitignore` file and load all the patterns from all the `.eslintignore` it finds along the way, and the ones from the `.gitignore` file.

The option is `loadIgnoreFile`, and it can be:

| Type     | Description                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `true`   | Load all the `.eslintignore` files it finds until it sees a `.gitignore`, and then load that too. This is the default behavior. |
| `false`  | Disable the feature.                                                                                                            |
| `number` | Specify how many levels upwards it should look for ignore files.                                                                |
| `object` | Customize the behavior with more options (see below).                                                                           |

And if you use an object, here are the available options:

| Key                | Type                              | Description                                                                                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `limit`            | `false \| number \| '.gitignore'` | Defines the behavior for how many levels upwards it should look for ignore files. If `false`, it will only look in the directory of the config file. If `'.gitignore'`, it will look until it finds a `.gitignore` file. Otherwise, it will look up to the specified number of levels. Default is `'.gitignore'`. |
| `includeGitignore` | `boolean`                         | Whether to include patterns from the `.gitignore` file when (and if) found. Default is `true`.                                                                                                                                                                                                                    |
| `ignoreFileName`   | `string`                          | **Optional**. If you want to use a different ignore file name instead of `.eslintignore`, you can specify it here.                                                                                                                                                                                                |

## Rules

Instead of listing the rules here, you can check all the files inside any `rules` directory outside `airbnb` (like `src/rules/es6.ts` or `src/react/rules/style.ts`) and you'll see all the customizations I made, with a comment explaining why I took that decision, and a link to the relevant documentation.

## Contributing

No, thanks :)
