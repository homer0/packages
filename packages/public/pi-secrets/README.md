# 🔐 Pi Secrets

Resolve secrets from providers like [Infisical](https://infisical.com), for [Pi](https://pi.dev) extensions, tools, and skills.

Instead of putting a token in a config file or an environment variable, you name the secret and this package gets it from a provider, caches it for a short time, and falls back to another provider if the first one fails.

## 🍿 Usage

> - ⚠️ **This package is for Pi.** It reads Pi's config through [`@homer0/pi-config`](https://www.npmjs.com/package/@homer0/pi-config) and caches with [`@homer0/pi-in-memory-cache`](https://www.npmjs.com/package/@homer0/pi-in-memory-cache); it's not a general-purpose secrets client.
> - If you are wondering why I built this, go to the [📝 Motivation](#-motivation) section.

- 📦 [Installation](#-installation)
- 🧙 [Config](#-config)
  - [Providers](#providers)
  - [Provider order](#provider-order)
  - [Local credentials](#local-credentials)
  - [Infisical](#infisical)
- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🔒 [Security](#-security)
- 🤘 [Development](#-development)
- 📝 [Motivation](#-motivation)

### 📦 Installation

This package is a library: it doesn't add tools or commands to Pi. Install it as a dependency of your extension, tool, or skill.

```bash
pnpm add @homer0/pi-secrets
```

It will give you access to an ESM module with the following:

| Export                                                                                              | What it is                                                                                       |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `getSecret`                                                                                         | Resolves one secret.                                                                             |
| `getSecrets`                                                                                        | Resolves many secrets at once, with one request per provider.                                    |
| `resolveInterpolatedValue`                                                                          | Resolves a config value that can be a reference: `$env:NAME`, `$secret:NAME`, or a plain string. |
| `SecretNotFoundError`                                                                               | The error thrown when a required secret can't be resolved.                                       |
| `SecretsConfigError`                                                                                | The error thrown when the config is inconsistent.                                                |
| `secretsConfigSchema`, `secretProviderConfigSchema`, `secretProviderTypeSchema`                     | The [Zod](https://zod.dev) schemas of the config.                                                |
| `SecretsConfig`, `SecretProviderConfig`, `SecretProviderType`, `GetSecretOptions`, `SecretProvider` | The types.                                                                                       |

> The agent should not call this directly, and its tools should never return secret values. Use it from Node code that needs the secret at runtime.

### 🧙 Config

The secrets are configured in `extensions.secrets`. The config is read with `@homer0/pi-config`, so it can go in a JSON or YAML file in your agent directory, or in your project directory. If you are not using `@homer0/pi-config` as an extension, assume it goes in a `config.yaml` file in your agent directory.

```yaml
extensions:
  secrets:
    cacheTtl: 10s
    providers:
      main: infisical-main
      fallbackOrder:
        - infisical-backup
      registry:
        infisical-main:
          type: infisical
          url: https://us.infisical.com
          enabled: true
          credentials:
            clientId: ...
            clientSecret: ...
            projectId: ...
            environment: dev
            secretPath: /
        infisical-backup:
          type: infisical
          url: https://eu.infisical.com
          enabled: true
          credentials:
            clientId: ...
            clientSecret: ...
            projectId: ...
            environment: dev
```

| Option                    | Default                           | What it does                                                                                        |
| ------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cacheTtl`                | `10s`                             | How long a resolved secret is cached for. A number of milliseconds, or a string like `30s` or `5m`. |
| `providers.main`          |                                   | The name of the provider to try first. It has to be in the registry, and enabled.                   |
| `providers.registry`      |                                   | The providers, by name.                                                                             |
| `providers.fallbackOrder` | all the providers of the registry | The names of the providers to try after the main one, in order.                                     |

If the config is not valid, the functions throw a validation error, before any provider is asked. If there is no `extensions.secrets` config, nothing is resolved: the functions return `undefined` (or throw, for required secrets).

#### Providers

Each provider in the registry has:

| Option        | What it does                                                             |
| ------------- | ------------------------------------------------------------------------ |
| `type`        | The implementation. Right now, only `infisical`.                         |
| `url`         | The base URL of the provider.                                            |
| `enabled`     | Disabled providers are skipped. The main one has to be enabled.          |
| `credentials` | What the implementation needs to log in. It's different for each `type`. |

#### Provider order

Both `getSecret` and `getSecrets` go through the providers in this order:

1. The main provider.
2. The providers in `fallbackOrder`, or all the ones in the registry if there isn't one. The main provider is not tried again, and the ones that are disabled, or are not in the registry, are skipped.

A provider that fails, or that doesn't have the secret, is passed over and the next one is tried. The first value that is found wins. With `getSecrets`, each provider is only asked for the names that are still pending, with one request for all of them.

If the main provider is not in the registry or is disabled, it's a `SecretsConfigError`.

#### Local credentials

Because the registry is a dictionary, a `config.local` file can override the credentials of one provider without repeating the rest of the config:

```yaml
extensions:
  secrets:
    providers:
      registry:
        infisical-main:
          credentials:
            clientId: my-local-client-id
            clientSecret: my-local-client-secret
```

#### Infisical

The Infisical provider uses [Universal Auth](https://infisical.com/docs/documentation/platform/identities/universal-auth): it logs in with the client id and secret of a machine identity, and lists the secrets of the project.

| Credential         | Required | What it is                                                                  |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| `clientId`         | Yes      | The client id of the machine identity.                                      |
| `clientSecret`     | Yes      | The client secret of the machine identity.                                  |
| `projectId`        | Yes      | The project to read the secrets from.                                       |
| `environment`      | Yes      | The environment of the project, like `dev`.                                 |
| `secretPath`       | No       | The path of the secrets in the project. It's `/` by default.                |
| `organizationSlug` | No       | The slug of the organization, if the identity needs it to log in.           |
| `skipTLSVerify`    | No       | Don't verify the TLS certificate of the server. Only for servers you trust. |

- The secrets that are imported in the project are included. If a key is both local and imported, the local one wins.
- The access token is kept in the process for as long as Infisical says it lives, so it's not asked for again on every call.

### ⚙️ Examples

#### Getting a secret

```ts
import { getSecret } from '@homer0/pi-secrets';

const token = await getSecret('API_TOKEN');
```

If no provider has it, you get a warning in the console, and `undefined`. With `required`, you get an error instead:

```ts
import { getSecret, SecretNotFoundError } from '@homer0/pi-secrets';

try {
  const token = await getSecret('API_TOKEN', { required: true });
} catch (error) {
  if (error instanceof SecretNotFoundError) {
    // `error.secretName` is 'API_TOKEN'
  }
}
```

If you need the secret for a project that is not the current directory, send it as `cwd`, and the config will be read from there:

```ts
const token = await getSecret('API_TOKEN', { cwd: '/path/to/project' });
```

#### Getting many secrets

```ts
import { getSecrets } from '@homer0/pi-secrets';

const { API_TOKEN, DB_URL } = await getSecrets(['API_TOKEN', 'DB_URL']);
```

It's better than calling `getSecret` in a loop, because each provider is asked once for all of them. The names you send are the keys of the result, and each value is a `string | undefined`.

With `required`, it throws a `SecretNotFoundError` for the first name that couldn't be resolved.

#### Using secrets in your own config

If your extension has a config value that holds a credential, like an API key, let the user write a reference instead of the value itself. `resolveInterpolatedValue` understands three prefixes:

| Reference       | What it resolves to                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `$env:VAR_NAME` | The environment variable. It throws if it's not set.                                                                         |
| `$secret:NAME`  | The secret, from the [providers](#providers). It throws a `SecretNotFoundError` if no provider has it.                       |
| `$config:PATH`  | What the config has in that path, resolved again. See [Pointing to another config value](#pointing-to-another-config-value). |

```ts
import { resolveInterpolatedValue } from '@homer0/pi-secrets';

const apiKey = await resolveInterpolatedValue({
  value: config.apiKey,
  cwd: ctx.cwd,
  // Only used in the error message, to tell the user which value failed.
  context: 'extensions.myExtension.apiKey',
});
```

A reference can be the whole value, or a part of it. The text around it is kept exactly as it is, and a value can have as many references as you need:

| Value                    | Result           |
| ------------------------ | ---------------- |
| `$secret:API_KEY`        | `the-key`        |
| `Bearer $secret:API_KEY` | `Bearer the-key` |
| `$env:USER $env:HOST`    | `homer0 laptop`  |
| `plain text`             | `plain text`     |

The rules of what is a reference:

- It starts with `$env:`, `$secret:` or `$config:`, followed by a name, and it ends at the next whitespace (a space, a tab, or a line break). The name is everything in between, so punctuation that is stuck to it, like the comma in `$env:NAME,`, is part of the name.
- It has to be at the start of the value or after whitespace. A prefix in the middle of a word is just text: `KEY=$env:NAME` and `a$env:NAME` are left as they are.
- The prefixes can be mixed, and if the same reference appears twice, it's resolved each time.
- What a reference resolves to is put in the text exactly as it is. A `$` in a secret, like in `pa$$word` or `a$&b`, is never read as anything else. (A `$config:` is the one that is resolved again, see below.)
- If a reference can't be resolved, the whole call throws, and the error is about the first one that failed.

It fails instead of leaving a placeholder or an empty string, because a blank credential only shows up later as an error like a 401, far from the typo that caused it.

#### Pointing to another config value

`$config:PATH` reads a dot path of the config, like `pi.custom.someKey`, and resolves what it finds with the same rules. That lets you keep the reference to a secret in one place of the config, and point to it from others:

```yaml
pi:
  custom:
    someKey: $secret:someName

extensions:
  myExtension:
    # Resolves to the secret named `someName`.
    apiKey: $config:pi.custom.someKey
```

- The path is read from the same config the rest of the package uses, with the config files merged and the session override applied, for the project directory you send as `cwd`.
- What the path holds is resolved again, so it can be a `$secret:`, an `$env:`, a text with references like `Bearer $secret:API_KEY`, or another `$config:`.
- **Only what comes from the config is resolved again.** The value of a secret or of an environment variable is used exactly as it is, even if it looks like a reference, so a secret that contains `$env:HOME` is never expanded.
- The path has to be set and has to hold a string. A number, a boolean, `null`, an object or a list is an error, because it can't be put in a text without guessing how.
- If the references go back to themselves, like `a` pointing to `b` and `b` to `a`, it throws instead of looping, and the error shows the chain: `a -> b -> a`.
- The errors of the config references are a `SecretsConfigError`. If what the path points to can't be resolved, the error is the one of that reference.

#### How the cache works

The values are cached in the [in-memory cache](https://www.npmjs.com/package/@homer0/pi-in-memory-cache), so they are shared by every process that uses it, not just the one that asked. They live for `cacheTtl`, and a secret that was not found is never cached.

### 🔒 Security

- The package doesn't log the secret values. The warnings have the name of the secret, the name of the provider, and the error the provider gave, like `Infisical auth failed with status 401.`.
- Keep the credentials in a `config.local` file, which you can leave out of your repository.
- The values are kept in the memory of the cache daemon, not on disk.
- `skipTLSVerify` turns off a protection: don't use it with servers you don't control.

### 🤘 Development

As this project is part of a monorepo, some of the tooling, like `lint-staged` and `husky`, is installed in the root's `package.json`.

#### Tasks

| Task          | Description                     |
| ------------- | ------------------------------- |
| `build`       | Builds the package.             |
| `lint`        | Lints the package.              |
| `lint:file`   | Lints the files you send to it. |
| `test`        | Runs the unit tests.            |
| `types:check` | Validates the TypeScript types. |

### 📝 Motivation

My agent works in multiple environments and I didn't want to store secrets on env vars. At the same time, I wanted to try different providers, like [Infisical](https://infisical.com) or [1Password](https://1password.com), so I built this package to abstract the way the agent accesses secrets, allowing me to switch providers without changing the agent's code.
