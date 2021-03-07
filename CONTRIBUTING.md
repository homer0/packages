# Contributing

Disclaimer: This is mostly for the `public` packages, because as I mentioned on the `README`, I'll probably won't be open to changes on the `personal` packages, but in case the change/suggestion makes sense, thise same guidelines would apply too.

## Pull request process

- Make sure `husky` and the repository hooks are properly installed: if you see that the tests are not being executed when you commit, then something wasn't properly installed.
- Please follow [Conventional Commits](https://www.conventionalcommits.org/): The scope should be `monorepo` or the name of the package and for breaking changes, use the `BREAKING CHANGES:` message and not the `!` symbol (it has some issues with Lerna).
- Don't let the tests converage go down.

Thanks 🤘
