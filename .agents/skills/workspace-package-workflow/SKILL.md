---
name: workspace-package-workflow
description: Use when changing, testing, or validating a package in this pnpm and Lerna workspace.
---

# Workspace Package Workflow

## When to use

Use this skill for work within `packages/public/*` or `packages/personal/*`.

## Steps

1. Read the target package's `package.json`, README, and relevant source or test files before editing.
2. Keep changes confined to the target package unless shared workspace configuration must change.
3. Use the package's declared scripts and run the narrowest relevant check first.
4. Report checks not run and why.
