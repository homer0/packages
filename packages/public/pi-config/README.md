# 🎛️ Pi Config

Config management building block for [Pi](https://pi.dev).

This package provides tools and utilities that can be used to make your Pi stuff easier to configure.

## 🍿 Usage

> - ⚠️ **This package is for Pi.** It reads Pi's config files and registers a Pi extension; it's not a general-purpose config loader.
> - If you are wondering why I built this, go to the [Motivation](#motivation) section.

- 📦 [Installation](#-installation)
  - [As an extension](#as-an-extension)
  - [As a library](#as-a-library)
- 🧙 [Configs](#-configs)
  - [File locations](#file-locations)
  - [Merging](#merging)
  - [Namespaces](#namespaces)
  - [Documenting your config](#documenting-your-config)
  - [Extending configs](#extending-configs)
  - [Session override](#session-override)
- ⚙️ [Examples](#%EF%B8%8F-examples)
- 🧰 [Tools and commands](#-tools-and-commands)
  - [get_config](#get_config)
  - [set_config](#set_config)
  - [/config-reset](#config-reset)
- 🚀 [TUI](#-tui)
- 🤘 [Development](#-development)
- 📝 [Motivation](#-motivation)

### 📦 Installation

You can use this package as an extension, which provides tools and commands for the agent, or as a library to read config from your own extension, tool, or skill.

#### As an extension

```bash
pi install npm:@homer0/pi-config
```

This will expose the following tools and commands to your Pi agent:

| Name                        | What it does                                                                  |
| --------------------------- | ----------------------------------------------------------------------------- |
| [`get_config`](#get_config) | Lets the agent read the resolved config (secret-looking values are redacted). |
| [`set_config`](#set_config) | Lets the agent override one config value for the current session.             |
| `/config`                   | Opens a TUI window to see the resolved config and edit the session override.  |
| `/config-reset`             | Clears the session override.                                                  |

⚠️: When using `get_config`, secret-looking values will be redacted in the output. To access those, you'll have to get them using the library functions like `getConfigValue` or `queryConfig`.

#### As a library

```bash
pnpm add @homer0/pi-config
```

> `@earendil-works/pi-coding-agent` and `@earendil-works/pi-tui` are peer dependencies: Pi provides them to your extension, so don't bundle them.

Installing it as a dependency will give you access to an ESM module with the following functions:

| Function         | What it does                                 |
| ---------------- | -------------------------------------------- |
| `getConfig`      | Reads the full resolved config.              |
| `getConfigValue` | Reads a single config value by its path.     |
| `queryConfig`    | Queries the config using a structured query. |

### 🧙 Configs

#### File locations

The config files can be written in JSON or YAML format, and the way the package will be read and merged follows a specific order, with later files overriding earlier ones. It will start in the global Pi directory and then look for project-specific config files (`<project>/.pi/`):

```txt
~/<agent>/config.{json,yml,yaml}
~/<agent>/config.local.{json,yml,yaml}
<project>/.pi/config.{json,yml,yaml}
<project>/.pi/config.local.{json,yml,yaml}
```

> The `<agent>` directory is given by Pi's `getAgentDir()` function, so it doesn't matter what you name it or where it is located; Pi will resolve it correctly.

The idea with the `.local.{json,yml,yaml}` files is that they are meant for local overrides that should not be committed to version control.

#### Merging

Each file is merged on top of the previous ones. Objects are deep-merged, and primitive values replace the previous value.

Arrays are merged by index, not replaced: the items of a later file take the place of the ones in the same position, but the extra items of an earlier array stay. For example, merging `[1, 2]` with `[3]` gives `[3, 2]`, so a later file can't make an array shorter.

#### Namespaces

Pi's config is organized into namespaces, each corresponding to a different kind of integration. The main namespaces are:

| Name.               | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `pi`                | Something that would affect the overall behavior of Pi. |
| `skills.<name>`     | Configuration for a specific skill.                     |
| `tools.<name>`      | Configuration for a specific tool.                      |
| `extensions.<name>` | Configuration for a specific extension.                 |

For example:

```yaml
pi:
  setting: value
skills:
  commit:
    runChecks: true
tools:
  bash:
    version: '5.1'
extensions:
  myExtension:
    enabled: true
```

#### Documenting your config

The schema of a config always belongs to whatever consumes it: a skill, tool, or extension that uses config should document its own keys. This package only defines the files, how they are merged, and how to read them.

When you document yours, include:

- The config path, for example `skills.commit.runChecks`.
- The type of the value and what happens when it's not set.
- Whether it's safe to set globally, it only makes sense per project, or it should only be local.
- An example.
- How invalid values are handled.

#### Extending configs

Config files can extend other config files using the `extends` key. This allows you to build on top of a base configuration and override specific values as needed. For example:

```yaml
extends: ../base-config.yaml
pi:
  setting: overriddenValue
```

The path for `extends` can be...

1. A relative path: `../base-config.yaml`
2. An absolute path: `/path/to/base-config.yaml`
3. A prefixed path:
   3.a. `pi:` refers to a config in the pi directory: `pi:base-config.yaml`
   3.b. `agent:` refers to a config in the agent directory: `agent:./some/base-config.yaml`
   3.c. `profile:<name>:` refers to a config inside a specific profile: `profile:dev:base-config.yaml`

> - `pi:` and `agent:` may map to the same directory or not, it depends on your Pi setup.
> - `profile:<name>:` is used when you have my `pi-profiles` extension.

A few more details:

- The base file is loaded first and the file that extends it is merged on top, so the current file always wins.
- The `extends` key is removed from the resolved config.
- Chains work: a base file can extend another one. Circular references are detected and logged as warnings, without breaking the loading of the config.

#### Session override

On top of the files, there's one more layer: the session override. It only lives in memory, for the current Pi process, and it has the highest precedence:

```txt
~/<agent>/config.{json,yml,yaml}
~/<agent>/config.local.{json,yml,yaml}
<project>/.pi/config.{json,yml,yaml}
<project>/.pi/config.local.{json,yml,yaml}
session override (in-memory, if set)
```

`getConfig`, `getConfigValue`, `queryConfig`, and the `get_config` tool apply it automatically, so your code doesn't need to know it exists. You set it with the [`set_config`](#set_config) tool or the [`/config`](#-tui) window, and you clear it with [`/config-reset`](#config-reset) or by emptying the editor in the window.

The override is stored on `globalThis` (as `__piConfigSessionOverride`) and not in a module variable. Pi loads each extension with its own copy of the modules it imports, so a module variable would only be visible to the code that shares the copy that wrote it. With `globalThis`, every extension in the process sees the same override, whichever copy of this package it uses.

Limitations:

- **Process-only, in-memory.** It's never written to a config file, and it's lost when the process exits (restart, new session, etc.).
- **Stale reads.** Only reads that happen after the override is set will reflect it. Anything that already read or cached the config earlier in the same process won't pick it up retroactively.
- **Whole-document override, not per-key unset.** Setting a path only replaces its value; there's no way to take a single path back to its file-based value. Clear the override entirely to go back to file-only config.
- **Not schema-validated when set.** Neither the `/config` editor nor `set_config` validate the shape of the override against a consumer's schema. A badly-shaped override only shows up later, as an error, if a library consumer calls `getConfigValue` with a Zod `schema` for the affected path. `queryConfig` and `get_config` never validate.

### ⚙️ Examples

This section will focus on the examples as a library and not the tools provides to the agent, since that will depend on how you would tell the agent to use them through AGENTS.md and/or SKILL.md files.

#### Reading config

```ts
import { getConfig, getConfigValue, queryConfig } from '@homer0/pi-config';

const config = await getConfig(); // the full resolved config
const runChecks = await getConfigValue('skills.commit.runChecks'); // a single path
const bash = await queryConfig({ scope: 'tool', name: 'bash' }); // a structured query
```

By default, the project config is looked up from `process.cwd()`. If your code works on another directory, send it as `cwd`:

```ts
const config = await getConfig({ cwd: '/path/to/project' });
```

#### Validating your config

`getConfig` and `getConfigValue` accept a [Zod](https://zod.dev) schema. If the config doesn't exist, you get the usual missing-config result; if it exists and the schema doesn't accept it, they throw a `ConfigValidationError`:

```ts
import { getConfigValue } from '@homer0/pi-config';
import { z } from 'zod';

const commitConfigSchema = z.object({
  runChecks: z.boolean().optional(),
});

const commitConfig = await getConfigValue('skills.commit', {
  schema: commitConfigSchema,
});
```

`queryConfig` doesn't accept a schema: it's the structured query the `get_config` tool is built on.

#### Typing your config

To get the type of a value from its path, extend the interfaces the package exports with [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation). There's one for each [namespace](#namespaces): `PiConfig`, `SkillsConfig`, `ToolsConfig`, and `ExtensionsConfig`:

```ts
declare module '@homer0/pi-config' {
  interface SkillsConfig {
    commit?: {
      runChecks?: boolean;
    };
  }
}
```

With that, `getConfigValue` infers the type of the value from the path:

```ts
const commit = await getConfigValue('skills.commit'); // { runChecks?: boolean } | undefined
```

The path itself is not checked: any string is accepted, and the type of the value is `unknown` when it can't be resolved. If you pass a [schema](#validating-your-config), its type is used instead.

### 🧰 Tools and commands

These are the tools and commands you get when you [install the package as an extension](#as-an-extension). The tools are for the agent: they are meant for when a tool, skill, or extension tells it (through its `AGENTS.md` or `SKILL.md`) to read or override config. `/config-reset` is a command for you, and the `/config` window has its own section: [TUI](#-tui).

#### get_config

Reads the resolved config: the files, plus the [session override](#session-override). Its parameters are:

| Parameter | Description                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`    | A dot-path to read, like `skills.commit.runChecks`.                                                                                                               |
| `scope`   | What to read: `all`, a whole namespace (`pi`, `skills`, `tools`, `extensions`), or a single integration (`skill`, `tool`, `extension`, which also need a `name`). |
| `name`    | The name of the skill, tool, or extension, for the `skill`, `tool`, and `extension` scopes.                                                                       |

The agent should use the narrowest query that answers its question:

```json
{ "path": "skills.commit.runChecks" }
{ "scope": "pi" }
{ "scope": "skill", "name": "commit" }
{ "scope": "tool", "name": "bash" }
{ "scope": "extension", "name": "myExtension" }
```

- Its prompt guidelines tell the agent to call it only when a tool, skill, or extension explicitly calls for config, and to treat missing config as no preference, not as an error.
- Secret-looking values are redacted in the result. Use the library functions if you need the raw values.

#### set_config

Overrides a single config value for the current session. Its parameters are:

| Parameter | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `path`    | The dot-path to override, like `extensions.myExtension.enabled`.         |
| `value`   | The value to set at that path. The rest of the override stays untouched. |

- It changes one path at a time, into the existing [session override](#session-override), and it replies with `Session override set: <path> = <value>`.
- Its prompt guidelines tell the agent to call it only when the user explicitly asks for an override, never speculatively or to work around an error.
- It can't clear the override or remove a path from it. Clearing is done with [`/config-reset`](#config-reset) or from the [`/config`](#-tui) window.

#### /config-reset

Clears the [session override](#session-override) right away, without opening a window. It's how you undo [`set_config`](#set_config), which can only set values, and it's also the quick alternative to emptying the editor in [`/config`](#-tui). It tells you if there was an override to clear: `Session config override cleared.` or `No session override was set.`

### 🚀 TUI

You open it with the `/config` command. It's a floating window titled "Config", with two tabs. Use `Tab` and `Shift+Tab` to switch between them, and `Esc` to close the window; closing it doesn't discard anything you already applied.

**Effective config** shows the resolved config as syntax-highlighted YAML. If it's larger than the window, you can scroll with `↑`, `↓`, `PageUp`, `PageDown`, `Home`, and `End`, and the footer shows which lines you are looking at. Press `t` to switch between the config coming only from the files and the effective config, which includes the session override. The status line always tells you what you are looking at:

| Status line                                 | What it means                                           |
| ------------------------------------------- | ------------------------------------------------------- |
| `No session override set`                   | There's no override.                                    |
| `Session override set — hidden (t to show)` | There's an override, but you are looking at files only. |
| `Session override set — shown (t to hide)`  | There's an override, and it's applied to what you see.  |

**Override** is a YAML editor, prefilled with the current session override (empty if there's none). Press `Enter` to submit it:

- A non-empty YAML mapping becomes the new override, and the window says `Session override applied.`
- Empty content, or YAML that parses to `null`, clears the override: `Session override cleared.`
- Anything else (invalid YAML, or a value that is not a mapping, like a string or a number) shows an inline error, like `Invalid YAML: ...`, and the previous override stays as it was.

To add a new line without submitting, use `Shift+Enter` or `Ctrl+J`.

### 🤘 Development

As this project is part of a monorepo, some of the tooling, like `lint-staged` and `husky`, is installed in the root's `package.json`.

#### Tasks

| Task          | Description                     |
| ------------- | ------------------------------- |
| `lint`        | Lints the package.              |
| `lint:file`   | Lints the files you send to it. |
| `test`        | Runs the unit tests.            |
| `types:check` | Validates the TypeScript types. |

## 📝 Motivation

When I started working with Pi, I saw a couple of things that I didn't like:

- Changing the model made a change in my `settings.json`
- I couldn't have a `settings.json` in the project I was working on for project-specific settings.
- I couldn't have a `settings.local.json` for local overrides, and I spent half of my day with a work laptop and the other half with a personal laptop.

Then I started building stuff for Pi, and realized that I wanted things to be configurable without having to mess with the `settings.json`, owned by the agent.

So I built this, and it's like one of my core building blocks for all the things I create for Pi.
