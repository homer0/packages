# eslint-plugin-homer0

[![David](https://img.shields.io/david/homer0/eslint-plugin-homer0.svg?style=flat-square)](https://david-dm.org/homer0/eslint-plugin-homer0)
[![David](https://img.shields.io/david/dev/homer0/eslint-plugin-homer0.svg?style=flat-square)](https://david-dm.org/homer0/eslint-plugin-homer0?type=dev)

My custom configurations for ESLint

## Motivation

Let's start with... **I LOVE** [ESLint](https://eslint.org/) and I use it on every project.

Together with ESLint, I use the [Airbnb's plugin](http://yarnpkg.com/en/package/eslint-config-airbnb-base), [`eslint-plugin-import`](http://yarnpkg.com/en/package/eslint-plugin-import) and [`eslint-plugin-node`](http://yarnpkg.com/en/package/eslint-plugin-import).

Everything is great, but...I'm always overwriting the same rules, and every time one the packages mentioned above is released, I have to go and update [every single project](https://www.npmjs.com/~homer0).

So, I decided to make my own plugin, with the configurations I use.

## Usage

Just include the plugin and `extend` from the configuration you want to use:

```json
{
  "root": true,
  "plugins": ["homer0"],
  "extends": ["plugin:homer0/node"]
}
```

### Available configurations

There are a few different configurations that can be used, dependending on the project and/or the scope:

#### Node

This is a basic configuration for Node that extends from `plugin:node/recommended`.

Name: `plugin:homer0/node`

#### Browser

This extends the base rules and disables a few ones from the `import` plugin, as most of the browser code I wrote goes through transpilation, so there's no need to validate production/development dependencies.

Name: `plugin:homer0/browser`

#### Jest

Jest is my favorite tool for testing, so all my projects (with test) use it. This configuration not only changes the environment to `jest` but it also disables a few rules from the `import` plugin. In this case, the reason for the disabled rules is that I also use (my own) [`jest-ex`](https://yarnpkg.com/en/package/jest-ex), which allows the use of absolute paths (that reference the root of the project).

Name: `plugin:homer0/jest`

## Rules

Here's a list of the rules I modified and the reason **I** did it:

### Best practices

#### [`complexity`](https://eslint.org/docs/rules/complexity)

> `off` -> `warn`.

I want the linter to warn me if I'm writing big function/methods.

#### [`class-methods-use-this`](https://eslint.org/docs/rules/class-methods-use-this)

> `error` -> `off`

I write almost everything using OOP, and some times I want to create a method to extract some logic and I don't want to be restricted by this rule.

#### [`no-magic-numbers`](https://eslint.org/docs/rules/no-magic-numbers)

> `off` -> `['error', { ignore: [0, 1, -1, 1000]}]`

I like self explanatory code, and magic numbers get in the way of that. The reason I left those 4 "ignore cases" is because...

- `0` and `1`: To work with arrays. Examples: To check if an array is empty or not, and to check if an array has a single element or more.
- `-1`: To work with `indexOf`.
- `1000`: To work with timestamps.

Now, this rule is disabled on the `jest` config, as it's not uncommon to use random numbers for "fake data" or to check calls with `.toHaveBeenCalledTimes()`.

#### [`no-param-reassign`](https://eslint.org/docs/rules/no-param-reassign)

> `['error', {...}]` -> `error`

I don't believe this is a good practice (as explained [by the rule](https://eslint.org/docs/rules/no-param-reassign)) and I prefer having to add an exception in the cases I need to use instead of having a lot of exceptions by default.

#### [`no-unmodified-loop-condition`](https://eslint.org/docs/rules/no-unmodified-loop-condition)

> `off` -> `error`

No idea why do they disabled this rule, it's a great help to avoid infinite loops.

#### [`no-useless-call`](https://eslint.org/docs/rules/no-useless-call)

> `off` -> `error`

I haven't use `call` or `apply` for years now, as I believe that with ES6 you can cover 99% of the cases in which they were useful. Now, I enabled this rule because if I can't prevent their use, I want to make it as restricted as possible.

#### [`no-useless-escape`](https://eslint.org/docs/rules/no-useless-escape)

> `error` -> `off`

Not all the time, but I use regular expressions quite a lot, and I have found cases in which this rule is unnecessarily triggered.

### Node

#### [`handle-callback-err`](https://eslint.org/docs/rules/handle-callback-err)

> `off` -> `['error', '^(err|error|\\w+Error)$']`

I consider error handling a "required good practice" on every project.

#### [`import/no-extraneous-dependencies`](https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-extraneous-dependencies.md)

> `error` -> `off`

You can't tell ESLint which part of the project is tooling for development and which part is for production, and I don't want to have to create different directories with other `.eslintrc` for this... at least for now.

#### [`no-mixed-requires`](https://eslint.org/docs/rules/no-mixed-requires)

> `off` -> `error`

It helps to organize the code a little bit.

#### [`no-process-env`](https://eslint.org/docs/rules/no-process-env)

> `off` -> `error`

No, I'm not crazy and is not that I don't use `process.env`. The reason I enabled this rule is because I think environment variables should be consumed on a single place, instead of reading them all over the project.

Instead of having the rule disable for all files, I prefer writing the "disable comment" on a single file.

#### [`node/no-unpublished-require`](https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-unpublished-require.md)

> `error` -> `off`

I don't get how this rule works...it gets triggered for some packages that comply with all the requirements a "published package" must have.

#### [`node/shebang`](https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/shebang.md)

> `error` -> `off`

This is because is not unusual **for me** to write `.sh` or extension-less files with the Node shebang...which triggers the rule.

### Style

#### [`array-bracket-newline`](https://eslint.org/docs/rules/array-bracket-newline)

> `off` -> `['error', 'consistent']

Consistency.

#### [`comma-dangle`](https://eslint.org/docs/rules/comma-dangle)

> `['error', {...}]` -> `['error', 2, {..., functions: 'never' }]`

I only made this change because all my projects are using it that way right now. I'll probably remove it on a major release and update the projects.

#### [`indent`](https://eslint.org/docs/rules/indent)

> `['error', 2, {...}]` -> `['error', 2, {..., MemberExpression: 0 }]`

I don't like to indent when there's really no need for it:

```js
// Bad
something()
  .then(() => ...);

// Good
something()
.then(() => ...);
```

#### [`lines-between-class-members`](https://eslint.org/docs/rules/lines-between-class-members)

> `['error', {...}]` -> `off`

Most of the times, I write JSDoc block comments between methods, and I consider that is enough "separation".

#### [`max-statements-per-line`](https://eslint.org/docs/rules/max-statements-per-line)

> `off` -> `['error', { max: 1 }]`

Readability

#### [`no-plusplus`](https://eslint.org/docs/rules/no-plusplus)

> `error` -> `off`

Yes, the reason for having this rule enabled is valid, but I don't believe that's a very common case.

#### [`no-underscore-dangle`](https://eslint.org/docs/rules/no-underscore-dangle)

> ```
> ['error', {
>   allow: [],
>   allowAfterThis: false,
>   allowAfterSuper: false,
>   enforceInMethodNames: true,
> }]
> ```
> ->
>
> ```
> ['error', {
>   allowAfterThis: true,
>   allowAfterSuper: true,
>   enforceInMethodNames: false,
> }]
> ```

Since I don't use [TypeScript](https://www.typescriptlang.org), I follow the convetion of prefixing protected/private property/methods with underscore.

#### [`operator-linebreak`](https://eslint.org/docs/rules/operator-linebreak)

> `['error', 'before', {...}]` -> `['error', 'after', {...}]`

I know that having the operators at the beginning of the line may better for readability for some people, but in my case, I find it easier to read if they are at the end. Yes, I may be that I've been using it like this for years.

#### [`prefer-object-spread`](https://eslint.org/docs/rules/prefer-object-spread)

> `error` -> `off`

Most of my projects are NPM packages, written for Node 8 (as the "oldest" LTS), which has no support for object spread. I'll remove this line once the LTS versions change.

## Development

### NPM/Yarn Tasks

| Task           | Description                         |
|----------------|-------------------------------------|
| `lint`         | Lint the modified files.            |
| `lint:full`    | Lint the project code.              |
| `todo`         | List all the pending to-do's.       |
