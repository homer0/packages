---
name: pi-update-package
description: Import or update a private package from ~/.pi/packages into this repository's packages/public directory, replaying source commits and maintaining REF.md.
disable-model-invocation: true
---

# Pi Update Package

Copy one package from `~/.pi/packages/<name>` to `packages/public/<name>`.
Keep the source read-only. Never publish, run Lerna versioning, or push.

## Setup

Set `skill_dir` to the absolute directory containing this SKILL.md. Run helper
commands from the destination repository with bounded shell timeouts:

```bash
bash "$skill_dir/pi-update-package.sh" <command> [arguments]
```

The helper needs Bash 3.2+, Git, and jq. Ask before installing missing tools.
Read workspace-package-workflow before adapting packages and js-style before
editing JS/TS. Do not load the commit skill for replay: these source commits are
already approved. Preserve their author, author date, and complete message without
individual approval or message rewrites. Newly authored commits follow the normal
commit skill and approval rules. Never bypass hooks automatically.

## Workflow

1. Run the helper's `discover` command. Use a tool to ask which listed package to
   import, with selectable options. Read its committed files, destination metadata,
   and existing REF.md notes; never copy source working-tree changes.
2. Require a clean destination and a named branch other than `main`. Offer to
   create a branch; after confirming its name, use `branch <name> --confirmed`.
   Never discard or stash unrelated work automatically.
3. Run `plan <package>` through the helper. This read-only subcommand lists package
   commits after the hash in REF.md, or all available package history for a new
   package. Missing or invalid baselines for existing packages require a question,
   not a guess. The source HEAD stays fixed throughout the replay.
4. For each source hash, run `patch <package> <hash>` to inspect the change, then
   `apply <package> <hash>`. Adapt the result, validate it, and run
   `commit [required-shared-file ...]`. These are all helper subcommands. The commit
   uses the original author/date/message; adaptations happen before committing,
   so no amend is needed. Adaptation-only no-ops still retain their source commit.
5. Keep repeatable adaptation notes in the pending state's `notes` file, whose
   location `apply` prints. After all commits, run `finish`. It writes REF.md once,
   with the last **source** hash, UTC update date, and those notes. It leaves REF.md
   uncommitted for review; committing it follows the normal commit approval rules.
   If there are no new commits, do nothing and leave REF.md unchanged.

## Adaptations and safety

- Preserve destination versions and maintain destination-specific repository paths,
  publishing metadata, scripts, exports, and file lists. A new package starts with
  its initial source version; subsequent source version changes must not replace it.
- Resolve source catalogs at each replayed commit. Only devDependencies may use
  `catalog:` here; runtime, optional, and peer dependencies need explicit ranges.
  Reconcile development tooling and `workspace:` references with this repository.
  Ask before importing prerequisite packages or exposing private dependencies.
- Required shared integration changes are allowed: workspace config, lockfile,
  root scripts, and root README. Pass the exact shared filenames to `commit`.
  Respect pnpm's release-age policy and document repeatable differences in notes.
- Reconcile clear patch conflicts yourself using the patch, source before/after,
  destination, and saved notes. The helper flattens merges into their first-parent
  net package changes. Inspect merges and historical path moves; ask when the
  correct mapping or result is unclear. Never overwrite with a source snapshot.
- Copy only the selected package's committed files, not unrelated private files.
  Flag suspected secrets, including in commit messages, before exposing them.
- Validate with the package's scripts and workspace conventions. Review the full
  diff and JS/TS checklist when applicable. Do not continue with unexplained edits
  or hook changes; ask before changing an original message to satisfy hooks.

## Recovery and checks

Progress lives in `$(git rev-parse --absolute-git-dir)/pi-update-package`, outside
REF.md. It records the last replayed source hash and any pending patch, author,
message, metadata, and notes. Resume that operation rather than starting over.
The helper rejects changed branches or source/destination HEADs. If interrupted
while committing or finishing, inspect the resulting commit and state and ask if
recovery is unclear; never reset, amend, or delete pending progress blindly.

Run `bash "$skill_dir/test.sh"` for guard checks and a mocked multi-commit replay;
add `--source <package>` for real read-only discovery, history, and patch checks.
No real commits are created; actual Git commit/recovery paths remain untested.
Ask before creating test repositories.

Report the imported range, destination commits, adaptations, shared-file changes,
checks, and uncommitted REF.md. Leave the branch ready for the user's PR review.
