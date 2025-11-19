import type { Config } from 'eslint/config';

export const jsdocRulesConfig: Config = {
  name: '@homer0: jsdoc',
  rules: {
    /**
     * Since most of the things I write are classes, I use the `@access` tag a lot, and
     * this rule is more about protecting you from typos and invalid values than a
     * restriction.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-access.md
     */
    'jsdoc/check-access': 'error',
    /**
     * It's not uncommon for IDEs/editors to "auto align" JSDoc blocks when you copy them
     * and mess the alignment of the stars.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-alignment.md
     */
    'jsdoc/check-alignment': 'error',
    /**
     * This is a big helper for when you update a function/method signature, since you
     * won't forget to update the JSDoc block.
     *
     * The `allowExtraTrailingParamDocs` option is enabled so you won't get errors when
     * documenting parameters for abstract methods.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-param-names.md
     */
    'jsdoc/check-param-names': [
      'error',
      {
        allowExtraTrailingParamDocs: true,
      },
    ],
    /**
     * It helps you prevent duplicated properties and avoid incomplete declarations.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-property-names.md
     */
    'jsdoc/check-property-names': 'error',
    /**
     * Helps avoid invalid syntax.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-syntax.md
     */
    'jsdoc/check-syntax': 'error',
    /**
     * This rule prevents the use of invalid JSDoc tags; the `definedTags` is used to add
     * the following exceptions:
     *
     * - `@parent`: I use it as an alias of `memberof` to be able use `module:` and avoid
     * issues with the plugin. I transform it to `memberof` using the `jsdoc-ts-utils`
     * package when generating the JSDoc site.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-tag-names.md
     */
    'jsdoc/check-tag-names': [
      'error',
      {
        definedTags: ['parent'],
      },
    ],
    /**
     * Helps with consistency as it forces you to always use the same casing for native
     * types.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-types.md
     */
    'jsdoc/check-types': 'error',
    /**
     * The `@implements` tag should only be used on classes.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/implements-on-classes.md
     */
    'jsdoc/implements-on-classes': 'error',
    /**
     * Enforces consistency.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/match-description.md
     */
    'jsdoc/match-description': 'error',
    /**
     * Everything should have a description.
     * The `checkConstructors ` option is to avoid comments like "class constructor".
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-description.md
     */
    'jsdoc/require-description': [
      'error',
      {
        checkConstructors: false,
      },
    ],
    /**
     * All descriptions should formatted as sentences.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-description-complete-sentence.md
     */
    'jsdoc/require-description-complete-sentence': 'off',
    /**
     * I never used, and I don't like, hyphens as separators on JSDoc blocks.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-hyphen-before-param-description.md
     */
    'jsdoc/require-hyphen-before-param-description': ['error', 'never'],
    /**
     * EVERYTHING should be documented!
     *
     * The `require` option is so the rule will be applied to all available contexts, and
     * `exemptEmptyConstructors` is so it will skip constructors with no pameters.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-jsdoc.md
     */
    'jsdoc/require-jsdoc': [
      'error',
      {
        require: {
          ArrowFunctionExpression: true,
          ClassDeclaration: true,
          ClassExpression: true,
          FunctionDeclaration: true,
          MethodDefinition: true,
        },
        exemptEmptyConstructors: true,
      },
    ],
    /**
     * Yes, every parameter should be documented.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param.md
     */
    'jsdoc/require-param': 'error',
    /**
     * Yes, every parameter should have a human-readable description.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param-description.md
     */
    'jsdoc/require-param-description': 'error',
    /**
     * I'm still not sure why this rule even exists, it should be part of
     * `jsdoc/require-param`.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param-name.md
     */
    'jsdoc/require-param-name': 'error',
    /**
     * Of course every parameter should have its type documented.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param-type.md
     */
    'jsdoc/require-param-type': 'error',
    /**
     * The type `Object` is like the `any` on TypeScript, it doesn't say anything; if you
     * are going to use it, you should documented the properties too.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property.md
     */
    'jsdoc/require-property': 'error',
    /**
     * Yes, every property should have a human-readable description.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property-description.md
     */
    'jsdoc/require-property-description': 'error',
    /**
     * Like `jsdoc/require-param-name`, this shouldn't exist.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property-name.md
     */
    'jsdoc/require-property-name': 'error',
    /**
     * Yes, the types should be documented.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property-type.md
     */
    'jsdoc/require-property-type': 'error',
    /**
     * Yes, the `@returns` tag is as important as `@param`.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-returns.md
     */
    'jsdoc/require-returns': 'error',
    /**
     * I like this rule because it's not that it validates the comments based on the code,
     * but it's the other way around: if you use `@returns`, the function/method should
     * have a `return` (_it's only logical_).
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-returns-check.md
     */
    'jsdoc/require-returns-check': 'error',
    /**
     * Yes, if there's a `@returns`, it should have a `type`.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-returns-type.md
     */
    'jsdoc/require-returns-type': 'error',
    /**
     * This helps a lot when writing error handling code.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-throws.md
     */
    'jsdoc/require-throws': 'error',
    /**
     * Prevents invalid definitions.
     *
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/valid-types.md
     */
    'jsdoc/valid-types': 'error',
  },
};
