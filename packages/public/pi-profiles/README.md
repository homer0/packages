# 🎭 Pi Profiles

Profiles for [Pi](https://pi.dev): turn sets of skills, extensions, and context on and off, per machine or per project.

You may run Pi in multiple environments, with different requirements, different _styles_. This package helps you manage those things as profiles, grouping related things, and enabling or disabling based on whatever rules you want.

## 🍿 Usage

> - ⚠️ **This package is for Pi.** It registers a Pi extension and reads Pi's directories; it's not a general-purpose profile manager.
> - If you are wondering why I built this, go to the [📝 Motivation](#-motivation) section.

- 📦 [Installation](#-installation)
  - [As an extension](#as-an-extension)
  - [As a library](#as-a-library)
- 📁 [Profiles](#-profiles)
  - [Structure](#structure)
  - [Configuration](#configuration)
  - [Enabling profiles](#enabling-profiles)
  - [Conditional profiles](#conditional-profiles)
  - [Packages](#packages)
- 🧰 [Commands](#-commands)
  - [/profiles-status](#profiles-status)
- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🤘 [Development](#-development)
- 📝 [Motivation](#-motivation)

### 📦 Installation

You can use this package as an extension, which loads your enabled profiles in every session, or as a library, to find out which profiles are enabled from your own extension, tool, or skill.

#### As an extension

```bash
pi install npm:@homer0/pi-profiles
```

This will make Pi do the following in every session, for the profiles that are enabled:

| When                | What it does                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Session start       | Shows the enabled profiles above the editor, and loads the extensions of their packages.            |
| Resources discovery | Adds the skills and prompts of the profiles, and the skills, prompts, and themes of their packages. |
| Before the agent    | Appends the `AGENTS.md` of each profile to the system prompt, under a `# Profile Context` header.   |

It also adds the [`/profiles-status`](#profiles-status) command.

#### As a library

```bash
pnpm add @homer0/pi-profiles
```

> `@earendil-works/pi-coding-agent` is a peer dependency: Pi provides it to your extension, so don't bundle it.

Installing it as a dependency will give you access to an ESM module with the following things:

| Export                   | What it is                                                     |
| ------------------------ | -------------------------------------------------------------- |
| `resolveEnabledProfiles` | A function that returns the names of the enabled profiles.     |
| `profilesConfigSchema`   | The [Zod](https://zod.dev) schema of the `pi.profiles` config. |
| `ProfilesConfig`         | The type of the `pi.profiles` config.                          |
| `ProfileLibOptions`      | The type of the options `resolveEnabledProfiles` takes.        |

The config is read with `@homer0/pi-config`, which is a dependency of this package. Installing this package doesn't install the extension of that one (the `get_config` tool and the `/config` command); for that, install it directly.

### 📁 Profiles

#### Structure

Each profile is a folder inside the `profiles` folder of the Pi agent directory (`<...>/agent/profiles/<name>/`). Everything in it is optional:

```
profiles/
└── work/
    ├── AGENTS.md       # Extra instructions for the agent
    ├── packages.json   # The packages to load
    ├── prompts/        # Prompt templates that are only available with this profile
    └── skills/         # Skills that are only available with this profile
```

#### Configuration

This package uses [`@homer0/pi-config`](https://www.npmjs.com/package/@homer0/pi-config), which is a config manager for Pi, and it allows you to put config files in JSON or YAML in your agent directory, and/or your project directory.

This README will cover a basic usage of `@homer0/pi-config`, but I strongly recommend reading its own README for a complete understanding of the possibilities it offers.

If you are not using `@homer0/pi-config`, assume that all the configurations described below go into a `config.yaml` file in your agent directory.

If the `pi.profiles` config is invalid, no profile is enabled, and you get a message with the reason.

#### Enabling profiles

Profiles are enabled with the `pi.profiles.enabled` config:

```yaml
pi:
  profiles:
    enabled:
      - work
      - dev
```

Just a list with the names of the profiles you want, and they have to match the directory names inside the `profiles` folder.

#### Conditional profiles

Profiles that are enabled under special conditions are defined in `pi.profiles.enabledIf`.

```yaml
pi:
  profiles:
    enabledIf:
      work: scripts/is-work-laptop.sh
      dev: false
```

This alternative complements `pi.profiles.enabled`, so the values you can give each profile key are just a script that determines whether the profile should be enabled, or `false`. You can't just set the value to `true`; for that, use `pi.profiles.enabled` instead.

Regarding the script,

1. It will be executed from the Pi directory.
2. The script can be `.sh` to run with `bash`, `.ts` to run with `jiti`, or any other extension that runs with `node`.
3. The path can be relative or absolute. A relative path is looked up in the project directory, then in the agent directory, and then in the Pi directory. The first one that has it wins.
   3.a. If the script is not found in any of these locations, the profile is not enabled, and a warning is issued.
4. The script should return the string `true` to enable the profile.

Based on the example above, the `is-work-laptop.sh` could look like this:

```sh
#!/bin/bash

# Check if the current machine is a work laptop
if [ "$(hostname)" = "work-laptop" ]; then
  echo "true"
else
  echo "false"
fi
```

#### Packages

A profile can have a `packages.json` file, which is like the profile version of the Pi `settings.json`'s `packages` key... but with a small extra feature.

Just like in `settings.json`, you have a `packages` array with the paths to the packages you want to load. You may already see the difference, which is that the paths have the same support as the profiles, meaning they can be relative or absolute, and can have an `enabledIf` condition.

```json
{
  "packages": [
    "./extensions/my-extension",
    "/absolute/path/to/another-package",
    { "path": "./extensions/only-at-work", "enabledIf": "scripts/is-work-laptop.sh" }
  ]
}
```

Packages are loaded the same way Pi loads the ones defined in the main `settings.json` file. So, yes, they support extensions, skills, prompts, and themes.

### 🧰 Commands

#### /profiles-status

Shows the profiles that were loaded in the current session: `Profiles loaded: work, dev`, or `No profiles loaded`.

### ⚙️ Examples

This section will focus on the examples as a library.

#### Finding out which profiles are enabled

```ts
import { resolveEnabledProfiles } from '@homer0/pi-profiles';

const profiles = await resolveEnabledProfiles({
  cwd: ctx.cwd,
  // Called with the reason when something non-fatal goes wrong. If you don't send it, the
  // issues are logged with `console.warn`.
  onError: (message) => ctx.ui.notify(message, 'warning'),
});
```

⚠️ The profiles are not stored in the session, so this function basically does the same resolution the agent did when the session started.

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

## 📝 Motivation

I spent half of my day with my work laptop, and then the other half with my personal one. I was starting to play with Pi and I knew out of the gate that I wanted to use the agent on both laptops, but that I'd have tools and settings that were specific to each environment; like, I'd never have a Jira configuration on my personal laptop xD.

So I built a simple version of this (at the same time as `@homer0/pi-config`) to manage my skills and extensions for work and never enable them on my personal laptop.

Then I realized that this approach could be generalized for any environment-specific configuration, not just my work and personal laptops; for example: now I have profiles for the meta harnesses that run Pi.
