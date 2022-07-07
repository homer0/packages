# ⚙️ Simple config

A very simple configuration management for your projects. It takes care of loading, activating, switching and merging configuration files.

## 🍿 Usage

> ⚠️ **This package is only for Node**.

- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)

### ⚙️ Example

Let's say your app tree looks like this:

```
myApp/
├── config/
│   ├── development.js
│   └── production.js
└── app/
    └── index.js
```

And you execute your app with something like:

```bash
node app
```

If you don't have anything managing the configurations, you would probably have something like this:

```js
const config = (
  await (process.NODE_ENV === 'production'
    ? import('../config/production')
    : import('../config/development'))
).default;
```

And the, `development.js` probably imports `production`, and has some deep merge logic, to avoid re writing the whole thing.

Maybe is different, but we can _simplify_ it a little bit with `simpleConfig`:

```ts
import { simpleConfig } from '@homer0/simple-config';

const config = simpleConfig({
  filenameFormat: '[name].js',
  path: 'config',
});

// ... sometime later, because there's not top-level await yet.

await config.load(process.NODE_ENV || 'development');
```

Now you can go to `development` and just add a key `extends` with the value `production`, and `simpleConfig` will take care of loading the file you need, and deep merge the one for development.

The reason the default options needed to be changed was because:

- `filenameFormat`: To avoid changing the name of the files, since the service looks for `[configName].[name].config.js` by default.
- `path`: To avoid creating another directory, since the service looks for files in `config/[configName]` by default.

#### Changing the name of the config

```ts
const config = simpleConfig({
  name: 'myApp',
});
```

The `name` option is used to generate the default values of multiple options:

- `defaultConfigFilename`: `myApp.config.js`.
- `envVarName`: `MY_APP_CONFIG`.
- `path`: `config/myApp`.
- `filenameFormat`: `myApp.[name].config.js`.

#### Default configuration

In the first example, we went directly to load a configuration file, but the service can also be used with the static default configuration:

```ts
const config = simpleConfig({
  defaultConfig: {
    foo: 'bar',
  },
});

const foo = config.get<string>('foo');
```

Since the service can hold many configurations, you can also specify the name of the default one with the `defaultConfigName` option:

```ts
const config = simpleConfig({
  defaultConfigName: 'fooBar',
  defaultConfig: {
    foo: 'bar',
  },
});
```

And, if you want the default configuration to be loaded from a specific file, you can specify its name with the `defaultConfigFilename` option:

```ts
const config = simpleConfig({
  defaultConfigFilename: 'fooBar.config.js',
});

// ...

await config.loadFromFile();
```

#### Loading a configuration based on an env var

In the first example, we were using the value of `NODE_ENV` to decide which configuration to load, but we could also use a specific env var to tell the service which configuration to load:

```bash
APP_CONFIG=development node app
```

Then...

```ts
const config = simpleConfig();

// ...

await config.loadFromEnv();
```

Using the defaults, the service will look at `APP_CONFIG`, and try to load `config/app.development.config.js`, if it exists.

#### Changing the directory where the configuration files are

By default, and using the `name` option, the service will look for the files in `config/[name]`, relative to the project root; this can be changed with the `path` option, by sending another path, also relative to the project root:

```ts
const config = simpleConfig({
  path: '.config',
  defaultConfigFilename: 'config.js',
});

// ...

await config.loadFromFile();
```

With that, it will look for `.config/config.js` instead of `config/app/app.config.js`.

#### Switching configurations

While developing an app, or when debugging it, it may be useful to switch between different configurations, and that's why the service gives you the possiblity of enabling this feature:

```ts
const config = simpleConfig({
  allowConfigSwitch: true,
});

// ...

await config.switch('anotherConfig');
```

With that, the service will try to switch the active configuration to the one specified, and if it's not loaded, it will try to load it from a file.

The service has another option relevant to this feature, which is the `allowConfigSwitchSetting`: When this setting is enabled, which it is by default, whenever the service loads a configuration, it will check if it has a boolean `allowConfigSwitch` property, and if it does, it will set the service property to the new value.

When calling the `load*` methods, the service ignores the `allowConfigSwitch` option, but if the implementation uses `.switch`, you can specify `allowConfigSwitch: false` on your configuration file, so once the file is loaded, the feature will be disabled.

#### Extending configurations

By default, all the configurations extend from the default one (sent when the service is initialized), but you can include an `extends` key on the configurations with the name of the one you want to extend.

Whenever the service tries to load a configuration that extends from one that is not registered, it will attempt to load it from a file.

#### Get and Set

The service is not only about managing files, it also comes with utility methods to read and write on the configurations:

##### Reading

Get a single setting:

```ts
const value = config.get('some-setting');
```

Get multiple settings:

```ts
const { settingOne, settingTwo } = config.get(['settingOne', 'settingTwo']);
```

Get multiple settings as an array:

```ts
const [settingOne, settingTwo] = config.get(['settingOne', 'settingTwo'], true);
```

And since the service uses my own [`object-utils`](https://www.npmjs.com/package/@homer0/object-utils), you can also use the `get` method with a dot-notation:

```ts
const value = config.get('some.setting');

// or

const [settingOne, settingTwo] = config.get(
  ['one.group.setting', 'two.something.else'],
  true,
);
```

##### Writing

Write a single setting:

```ts
config.set('some-setting', 'some-value');
```

Write multiple settings:

```ts
config.set({
  settingOne: 'valueOne',
  settingTwo: 'valueTwo',
});
```

And, like `get`, you can use dot notation:

```ts
config.set('some.setting', 'some-value');

// or

config.set({
  'one.group.setting': 'valueOne',
  'two.something.else': 'valueTwo',
});
```

A special feature of the `set` method is that, by default, if the new value and the old values are both objects, instead of overwriting the old one, it will deep merge the new one into the old one:

```ts
config.set('person', {
  name: 'Rosario',
  birthday: '',
});

// ...

config.set('person', {
  birthday: '25-09-2015',
});

/**
 * The current value of the setting would be:
 * {
 *   name: 'Rosario',
 *   birthday: '25-09-2015',
 * }
 */
```

You can disable this functionality by sending a third parameter to the `set` method:

```ts
config.set(
  'person',
  {
    birthday: '25-09-2015',
  },
  false,
);

/**
 * The current value of the setting would be:
 * {
 *   birthday: '25-09-2015',
 * }
 */
```

#### Jimple provider

If your app uses a [Jimple container](https://npmjs.com/package/jimple), you can register `SimpleConfig` as the `config` service by using its provider:

```ts
import { simpleConfigProvider } from '@homer0/simple-config';

// ...

container.register(simpleConfigProvider);

// ...

const config = container.get('config');
```

And since the provider is a "provider creator" (created with [my custom version of Jimple](https:///npmjs.com/package/@homer0/jimple)), you can customize its service name, and options:

```ts
container.register(
  simpleConfigProvider({
    serviceName: 'myConfig',
    path: '.config',
    defaultConfigFilename: 'config.js',
  }),
);
```

##### Dependencies

`SimpleConfig` depends on the following services, and when used with Jimple, it will try to find them in the container, otherwise, it will create new instances:

- [`@homer0/env-utils`](https://npmjs.com/package/@homer0/env-utils), with the name `envUtils`. Used to get the check the environment variable.
- [`@homer0/root-file`](https://npmjs.com/package/@homer0/root-file), with the name `rootFile`. Used to get import the configuration files.
- [`@homer0/path-utils`](https://npmjs.com/package/@homer0/path-utils), with the name `pathUtils`. Needed by `rootFile` to generate the paths relative to the project root.

If you already implement the dependencies, but with a different name, you can specify them in the provider:

```ts
container.register(
  simpleConfigProvider({
    services: {
      envUtils: 'myEnvUtils',
      rootFile: 'myRootFile',
      pathUtils: 'myPathUtils',
    },
  }),
);
```

### 🤘 Development

As this project is part of the `packages` monorepo, it requires Yarn, and some of the tooling, like ESLint and Husky, are installed on the root's `package.json`.

#### Yarn tasks

| Task    | Description          |
| ------- | -------------------- |
| `test`  | Runs the unit tests. |
| `build` | Bundles the project. |
