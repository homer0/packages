# eslint-plugin-homer0

![Dependencies status](https://img.shields.io/david/homer0/packages?path=packages%2Fpersonal%2Feslint-plugin)

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

#### JSDoc

I'm a big fan of documenting EVERY class, method/function, property, etc; so this configuration helps me validate that all my comments are valid [JSDoc](https://jsdoc.app).

Name: `plugin:homer0/jsdoc`

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

> `off` -> `['error', { ignore: [0, 1, -1, 60, 1000]}]`

I like self explanatory code, and magic numbers get in the way of that. The reason I left those 4 "ignore cases" is because...

- `0` and `1`: To work with arrays. Examples: To check if an array is empty or not, and to check if an array has a single element or more.
- `-1`: To work with `indexOf`.
- `60` and `1000`: To work with timestamps.

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

> `off` -> `['error', 'consistent']`

Consistency.

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

Since I don't use [TypeScript](https://www.typescriptlang.org), I follow the convention of prefixing protected/private property/methods with underscore.

#### [`operator-linebreak`](https://eslint.org/docs/rules/operator-linebreak)

> `['error', 'before', {...}]` -> `['error', 'after', {...}]`

I know that having the operators at the beginning of the line may better for readability for some people, but in my case, I find it easier to read if they are at the end. Yes, I may be that I've been using it like this for years.

### JSDoc

These are not overwrites, [the plugin I use](http://yarnpkg.com/en/package/eslint-plugin-jsdoc) doesn't have a default preset, so I'm just going to explain why did enabled each rule and what values they have.

#### [`jsdoc/check-access`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-check-access)

> `'error'`

Since most of the things I write are classes, I use the `@access` tag a lot, and this rule is more about protecting you from typos and invalid values than a restriction.

#### [`jsdoc/check-alignment`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-check-alignment)

> `'error'`

It's not uncommon for IDEs/editors to "auto align" JSDoc blocks when you copy them and mess the alignment of the asterisks.

#### [`jsdoc/check-param-names`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-check-param-names)

> `['error', { allowExtraTrailingParamDocs: true }]`

This is a big helper for when you update a function/method signature, you won't forget to update the JSDoc block.

The `allowExtraTrailingParamDocs` option is enabled so you won't get errors when documenting parameters for abstract methods.

#### [`jsdoc/check-property-names`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-check-property-names)

> `'error'`

It helps you prevent duplicated properties and avoid incomplete declarations.

#### [`jsdoc/check-syntax`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-check-syntax)

> `'error'`

Helps avoid invalid syntax.

#### [`jsdoc/check-tag-names`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-check-tag-names)

> ```
> ['error', {
>   definedTags: ['parent'],
> }]
> ```

This rule prevents the use of invalid JSDoc tags; the `definedTags` is used to add the following exceptions:

- `parent`: I use it as an alias of `memberof` to be able use `module:` and avoid issues with the plugin. I transform it to `memberof` using the [`jsdoc-ts-utils`](https://yarnpkg.com/package/jsdoc-ts-utils) when generating the JSDoc site.

#### [`jsdoc/check-types`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-check-types)

> `'error'`

Helps with consistency as it forces you to always use the same casing for native types.

#### [`jsdoc/implements-on-classes`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-implements-on-classes)

> `'error'`

The `@implements` tag should only be used on classes.

#### [`jsdoc/match-description`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-match-description)

> `'error'`

Consistency.

#### [`jsdoc/newline-after-description`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-newline-after-description)

> `'error'`

The block looks better with a little padding.

#### [`jsdoc/require-description`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-description)

> `['error', { checkConstructors: false }]`

Everything should have a description.

The `checkConstructors ` option is to avoid comments like "class constructor".

#### [`jsdoc/require-description-complete-sentence`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-description-complete-sentence)

> `'error'`

All descriptions should formatted as sentences.

#### [`jsdoc/require-hyphen-before-param-description`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-hyphen-before-param-description)

> `['error', 'never']`

I never used, and I don't like, hyphens as separators on JSDoc blocks.

#### [`jsdoc/require-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-jsdoc)

> ```
> ['error', {
>   require: {
>     allowAfterThis: true,
>     ArrowFunctionExpression: true,
>     ClassDeclaration: true,
>     ClassExpression: true,
>     FunctionDeclaration: true,
>     MethodDefinition: true,
>   },
>   exemptEmptyConstructors: true,
> }]
> ```

EVERYTHING should be documented!

The `require` option is so the rule will be applied to all available contexts, and `exemptEmptyConstructors` is so it will skip constructors with no pameters.

#### [`jsdoc/require-param`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-param)

> `'error'`

Yes, every parameter should be documented.


#### [`jsdoc/require-param-description`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-param-description)

> `'error'`

Yes, every parameter should have a human-readable description.

#### [`jsdoc/require-param-name`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-param-name)

> `'error'`

I'm still not sure why this rule even exists, it should be part of `jsdoc/require-param`.

#### [`jsdoc/require-param-type`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-param-type)

> `'error'`

Of course every parameter should have its type documented.

#### [`jsdoc/require-property`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-property)

> `'error'`

The type `Object` is like the `any` on TypeScript, it doesn't say anything; if you are going to use it, you should documented the properties too.

#### [`jsdoc/require-property-description`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-property-description)

> `'error'`

Yes, every property should have a human-readable description.

#### [`jsdoc/require-property-name`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-property-name)

> `'error'`

Like `jsdoc/require-param-name`, this shouldn't exist.

#### [`jsdoc/require-property-type`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-property-type)

> `'error'`

Yes, the types should be documented.

#### [`jsdoc/require-returns`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-returns)

> `'error'`

Yes, the `@returns` tag is as importan as `@param`.

#### [`jsdoc/require-returns-check`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-returns-check)

> `'error'`

I like this rule because is not that it validates the comments based on the code, but it's the other way around: if you use `@returns`, the function/method should have a `return` (_it's only logical_).

#### [`jsdoc/require-returns-type`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-returns-type)

> `'error'`

Yes, if there's a `@returns`, it should have a `type`.

#### [`jsdoc/require-throws`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-throws)

> `'error'`

This helps a lot when writing error handling code.

#### [`jsdoc/valid-types`](https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-valid-types)

> `'error'`

Prevents invalid definitions.

### TypeScript

#### [`node/no-unsupported-features/es-syntax`](https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-unsupported-features/es-syntax.md)

> `['error', { ignores: ['modules'] }]`

Because TypeScript uses ES syntax.

#### [`node/no-unpublished-import`](https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-unpublished-import.md)

> `off`

Like the version for `require`, not sure how the rule works.

#### [`import/extensions`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/extensions.md)

> `off`

It's an overkill.

#### [`import/prefer-detaul-export`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/prefer-default-export.md)

> `off`

Because TypeScript uses ES syntax, and the only case in which I would consider to enforce this rule would be CommonJS, where it's actual a destructuring assignment.

#### [`lines-between-class-members`](https://eslint.org/docs/rules/lines-between-class-members)

> `off`

I enforce this rule when using JSDoc, as the blocks work as _separators_ between the methods. When working with TypeScript, I don't use that much JSDoc, so I want to be able to leave an empty line between the methods.

#### [`@typescript-eslint/no-empty-function`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-empty-function.md)

> `off`

Empty function are a common resource for optional paramters/properties.

#### [`@typescript-eslint/no-non-null-assertion`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-non-null-assertion.md)

> `off`

There are some cases, mostly on frontend, where you know the state is non-null, and I don't want to have to use optional chaining for EVERYTHING.

#### [`@typescript-eslint/ban-ts-comment`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/ban-ts-comment.md)

> ```
> ['error', {
>   require: {
>     'ts-expect-error': 'allow-with-description',
>     'ts-ignore': 'allow-with-description',
>     'ts-nocheck': 'allow-with-description',
>     'ts-check': 'allow-with-description',
>   },
>   exemptEmptyConstructors: true,
> }]
> ```

I'm allowed to ignore TypeScript... with a valid excuse.

## Development

### NPM/Yarn Tasks

| Task       | Description                   |
|------------|-------------------------------|
| `lint`     | Lint the modified files.      |
| `lint:all` | Lint the project code.        |
| `todo`     | List all the pending to-do's. |

### Repository hooks

I use [`husky`](https://yarnpkg.com/package/husky) to automatically install the repository hooks so the code will be tested and linted before any commit and the dependencies updated after every merge.

The configuration is on the `husky` property of the `package.json` and the hooks' files are on `./utils/hooks`.

#### Commits convention

I use [conventional commits](https://www.conventionalcommits.org) with [`commitizen`](https://yarnpkg.com/package/commitizen) in order to support semantic releases. The one that sets it up is actually husky, that installs a script that runs commitizen on the `git commit` command.

The hook for this is on `./utils/hooks/prepare-commit-msg` and the configuration for comitizen is on the `config.commitizen` property of the `package.json`.
