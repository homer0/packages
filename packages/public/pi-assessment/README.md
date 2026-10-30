# 🔎 Pi Assessment

A [Pi](https://pi.dev) extension and skill to assess a past session: pick it from a list, extract its transcript, and review it for preferences, corrections, recurring workflows, missing capabilities, and agent mistakes, to recommend persistent improvements.

## 🍿 Usage

> - If you are wondering why I built this, go to the [📝 Motivation](#-motivation) section.

- 📦 [Installation](#-installation)
- ⚙️ [Commands](#️-commands)
  - [`/session-assessment`](#session-assessment)
- 🧠 [Skill](#-skill)
- 🤘 [Development](#-development)
- 📝 [Motivation](#-motivation)

### 📦 Installation

```bash
pi install npm:@homer0/pi-assessment
```

This registers the command and the skill below.

#### pi-install-pnpm-package

If you are using my pnpm setup with [`@homer0/pi-install-pnpm-package`](https://www.npmjs.com/package/@homer0/pi-install-pnpm-package), you can install this package with:

```text
/install-pi-pnpm-package @homer0/pi-assessment
```

### ⚙️ Commands

#### `/session-assessment`

1. Lists the sessions of the current directory that have a name, newest first, up to 20, without the session you are in.
2. Asks you to pick one.
3. Writes the transcript of that session to a Markdown file in the temp directory.
4. Runs the `assessment` skill on that file.

If there are no named sessions, it warns and stops.

The transcript has the active branch of the conversation, in order: the full user and assistant text, the assistant's thinking, and the name and arguments of every tool call. Tool results are reduced to their status (`ok` or `error`) and the first 100 characters.

### 🧠 Skill

The `assessment` skill (`/skill:assessment`) is only used when you ask for it. It has two modes:

- **Live:** with no argument, it assesses the current conversation.
- **Transcript file:** with the path of a file like the one the command writes, it assesses that transcript instead, and, when it finishes, it asks to delete the file.

Both modes end with a report of findings and recommendations (an `AGENTS.md` rule, a skill, an extension, or no change).

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

This was probably the first thing I built when I started using Pi. I saw that [Hermes](https://hermes-agent.nousresearch.com/) had a way to self improve and I wanted something similar, but on demand and that I could review.

With this, I can transform the mistakes of past sessions into actionable improvements for future ones.
