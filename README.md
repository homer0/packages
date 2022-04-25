# Packages

Monorepo for unrelated Node packages of personal use, like my `eslint-plugin`, and packages that are small enough and/or not ready to have their own repository, like `aurelia-extract-clean-loader`.

## Types

### Public packages

These packages are meant to be used by anyone, that's why the "public", and these are the reasons they are here and not on their own repository:

- **If they are small:** Having to maintain an entire repository (ESLint, Husky, Jest, etc.) for a one-file-package is too much of an effort; the situation may change if a package gets some contributors, as managing issues and PR on a monorepo of unrelated packages would be kind of tedious.
- **If they are MVPs:** I may be trying to validate the idea behind a package before moving to its own repository; again, maintaining a repository is not easy.

They're on `/packages/public`.

### Personal

These packages are related to personal configuration and/or tooling; the only difference with the "public packages" is that I'll probably won't accept feature/change requests for them.

## Development

### Yarn

This repository uses [Lerna](https://lerna.js.org) for managing the publication and the version of the packages, and [Yarn](https://classic.yarnpkg.com) for the dependencies.

Because the repository uses [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces), **having Yarn installed is a MUST** and you can't use it with NPM. Following [this link](https://classic.yarnpkg.com/en/docs/install) you'll get the necessary instructions to install Yarn.

Now, once installed, you just need to execute `yarn` to install all the repository (and the packages) dependencies.

> At the end of 2022, when I drop support for Node 14, I'll drop Yarn, as latest NPM version now has support for workspaces, added to the fact that Yarn doesn't respect lock files in monorepos.

### Linting

The entire repository is linted using [ESLint](https://eslint.org) and custom plugin you can find in `packages/personal/eslint-plugin`.

There are two scripts you can use to lint files:

- `yarn lint` will use [`lint-staged`](https://yarnpkg.com/package/lint-staged) to run ESLint on the files that are staged.
- `yarn lint:all` will lint the entire repository.

### Tests

To run the tests of all the packages that have you just need to run `yarn test`, but if you want to run the tests for a single package, you can use the following command:

```
yarn test --scope [package-name-with-scope]
```

And if you need to send extra arguments to that package tests, you'll have to use two double dashes to separate them:

```
yarn test --scope [package-name-with-scope] -- -- [...args]
```
