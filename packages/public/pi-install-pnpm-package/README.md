# 📦 Pi Install pnpm Package

Install and uninstall [pnpm](https://pnpm.io)-backed [Pi](https://pi.dev) packages from slash commands, in a Pi config repo that is a pnpm workspace.

Instead of editing the workspace catalog, a `package.json`, `settings.json` and the lockfile by hand, you run one command and it also creates the commit.

## 🍿 Usage

> - ⚠️ **This package expects Pi setup to be in a pnpm-managed monorepo.**
> - If you are wondering why I built this, go to the [📝 Motivation](#-motivation) section.

- 🗂️ [pnpm Workspace](#-pnpm-workspace)
- 📦 [Installation](#-installation)
- ⚙️ [Commands](#️-commands)
  - [`/install-pi-pnpm-package`](#install-pi-pnpm-package-name)
  - [`/uninstall-pi-pnpm-package`](#uninstall-pi-pnpm-package-name)
  - [Profiles](#profiles)
- 🤘 [Development](#-development)
- 📝 [Motivation](#-motivation)

### 🗂️ pnpm Workspace

Instead of installing Pi globally and managing the extensions through its own commands, this setup gives you a more controlled and centralized layout, where your Pi directory is a monorepo and dependency versions are managed through a pnpm workspace catalog.

```text
~/
└── .pi
    ├── agent
    │   ├── extensions
    │   │   └── pnpm
    │   │       ├── package.json
    │   │       └── node_modules
    │   │           ├── pi-install-pnpm-package
    │   │           └── other-extension
    │   └── settings.json
    ├── pnpm-workspace.yaml
    └── pnpm-lock.yaml
```

Yes, it's more complicated than basic Pi setups, but you have way more control over your dependencies. For example:

- [minimumReleaseAge](https://pnpm.io/settings/dependency-resolution#minimumreleaseage): Define the minimum number of minutes that must pass after a version is published before pnpm will install it. This applies to all dependencies, including transitive ones.
- [overrides](https://pnpm.io/settings/dependency-resolution#overrides): It allows you to instruct pnpm to override any dependency in the dependency graph, including peer dependencies. This is useful for enforcing all your packages to use a single version of a dependency, backporting a fix, replacing a dependency with a fork, or removing an unused dependency.

Check [pnpm documentation](https://pnpm.io/) for more details on these settings.

### 📦 Installation

Since this is the package that will manage the installation of extensions through pnpm, its installation will be a bit different.

> All these steps assume that you are in `~/.pi` and your agent is `~/.pi/agent`.

1. Tell pnpm that the extensions directory will contain packages. If you don't have a `pnpm-workspace.yaml` yet, create one in the root of your Pi directory.

```yaml
packages:
  - 'agent/extensions/*'
```

> If you are using [`@homer0/pi-profiles`](https://www.npmjs.com/package/@homer0/pi-profiles), make sure to include `agent/profiles/*/extensions/*` too.

2. Create the catalog section for extensions in your `pnpm-workspace.yaml` if it doesn't exist yet, and add an entry for this package.

```yaml
catalog:
  ## Extensions
  '@homer0/pi-install-pnpm-package': '<version>'
```

⚠️ The `## Extensions` comment is important, the extension uses it to put all the installed packages together.

3. Add a `package.json` in the directory where pnpm will install the extensions:

```sh
mkdir -p ./agent/extensions/pnpm
echo '{ "name": "pi-extensions", "private": true, "dependencies": { "@homer0/pi-install-pnpm-package": "catalog:" } }' > ./agent/extensions/pnpm/package.json
```

4. Install the dependencies:

```bash
pnpm install
```

If you check `agent/extensions/pnpm/node_modules`, you should see `@homer0/pi-install-pnpm-package` installed there.

5. Register the extension

For this, you have to go to `agent/settings.json` and add an entry for it:

```
{
  "packages": {
    "./extensions/pnpm/node_modules/@homer0/pi-install-pnpm-package"
  }
}
```

### ⚙️ Commands

#### `/install-pi-pnpm-package <name>`

1. Resolves the newest stable version that is old enough for the `minimumReleaseAge` of `pnpm-workspace.yaml` (a package in `minimumReleaseAgeExclude` has no minimum age). Only if the setting is present.
2. Adds the package to the `# Extensions` section of the workspace catalog: `^<version>` for major `1` and up, the exact version for `0.x`.
3. Adds it to `agent/extensions/pnpm/package.json` as `catalog:`.
4. Adds `./extensions/pnpm/node_modules/<name>` to `agent/settings.json`.
5. Runs `pnpm install` from the repo root.
6. Creates a commit with the changed files:

```text
feat(pi): install <name>@<version>
```

#### `/uninstall-pi-pnpm-package <name>`

1. Removes the package from the `# Extensions` section of the catalog.
2. Removes the dependency from `agent/extensions/pnpm/package.json`.
3. Removes `./extensions/pnpm/node_modules/<name>` from `agent/settings.json`.
4. Runs `pnpm install` from the repo root.
5. Creates a commit with the changed files:

```text
fix(pi): uninstall <name>@<version>
```

If the version can't be found in the catalog, the commit has no `@<version>`.

#### Profiles

If you are using [`@homer0/pi-profiles`](https://www.npmjs.com/package/@homer0/pi-profiles), and you have folders under `agent/profiles`, `/install-pi-pnpm-package` asks where to install: `Global` or one of the profiles. For a profile, the package is added to `agent/profiles/<profile>/extensions/pnpm/package.json` (created if it doesn't exist) and to `agent/profiles/<profile>/packages.json`, with the prefix `./profiles/<profile>/extensions/pnpm/node_modules/`.

`/uninstall-pi-pnpm-package` looks for the package in the global settings and in every profile, and asks from where to uninstall it when it is in more than one.

Both commands wait for the agent to be idle before they start. They report a failure as a notification, but they don't undo the files they already changed, so check `git status` if a command fails.

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

I want more control over my Pi installation, so my whole setup is around a pnpm-managed monorepo, where I can configure things like `minimumReleaseAge` and have a single catalog of dependencies. Since I can't use the Pi commands to install extensions directly, I wrote this extension to work almost the same way, but for a pnpm monorepo.
