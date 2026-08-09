# Rule differences

This record compares enabled rules in `@homer0/eslint-plugin` with the initial Oxlint policy. The source inventory is resolved from the current package configs.

## Policy decisions

- `sort-imports` is disabled. Import ordering remains outside this package.
- JSDoc has no initial profile.
- Rules without a native Oxlint equivalent are omitted rather than provided through JavaScript plugins.

## Intentional omissions and approximations

The initial profile is native-only. Unsupported `import-x` rules for dependency checks, package boundaries, path cleanup, resolution, and ordering are omitted; import ordering remains formatter-owned. Unsupported Node compatibility and dependency rules are also omitted rather than approximated with JavaScript plugins.

There is no JSDoc profile. Oxlint's native JSDoc support is intentionally deferred because it does not cover the existing validation policy. React's obsolete JSX-use rules are covered by Oxlint's unused-variable analysis; `react/no-deprecated` can only be partially covered by optional type-aware `typescript/no-deprecated` when project typings mark an API as deprecated.

## Native equivalents

| ESLint rule                                              | Oxlint rule                                              |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `@typescript-eslint/ban-ts-comment`                      | `typescript/ban-ts-comment`                              |
| `@typescript-eslint/dot-notation`                        | `typescript/dot-notation`                                |
| `@typescript-eslint/no-unused-vars`                      | `typescript/no-unused-vars`                              |
| `array-callback-return`                                  | `array-callback-return`                                  |
| `arrow-body-style`                                       | `arrow-body-style`                                       |
| `block-scoped-var`                                       | `block-scoped-var`                                       |
| `complexity`                                             | `complexity`                                             |
| `consistent-return`                                      | `consistent-return`                                      |
| `constructor-super`                                      | `constructor-super`                                      |
| `default-case`                                           | `default-case`                                           |
| `default-case-last`                                      | `default-case-last`                                      |
| `default-param-last`                                     | `default-param-last`                                     |
| `eqeqeq`                                                 | `eqeqeq`                                                 |
| `for-direction`                                          | `for-direction`                                          |
| `func-names`                                             | `func-names`                                             |
| `getter-return`                                          | `getter-return`                                          |
| `grouped-accessor-pairs`                                 | `grouped-accessor-pairs`                                 |
| `guard-for-in`                                           | `guard-for-in`                                           |
| `import-x/export`                                        | `import/export`                                          |
| `import-x/first`                                         | `import/first`                                           |
| `import-x/named`                                         | `import/named`                                           |
| `import-x/newline-after-import`                          | `import/newline-after-import`                            |
| `import-x/no-absolute-path`                              | `import/no-absolute-path`                                |
| `import-x/no-amd`                                        | `import/no-amd`                                          |
| `import-x/no-cycle`                                      | `import/no-cycle`                                        |
| `import-x/no-duplicates`                                 | `import/no-duplicates`                                   |
| `import-x/no-dynamic-require`                            | `import/no-dynamic-require`                              |
| `import-x/no-mutable-exports`                            | `import/no-mutable-exports`                              |
| `import-x/no-named-as-default`                           | `import/no-named-as-default`                             |
| `import-x/no-named-as-default-member`                    | `import/no-named-as-default-member`                      |
| `import-x/no-named-default`                              | `import/no-named-default`                                |
| `import-x/no-self-import`                                | `import/no-self-import`                                  |
| `import-x/no-webpack-loader-syntax`                      | `import/no-webpack-loader-syntax`                        |
| `max-classes-per-file`                                   | `max-classes-per-file`                                   |
| `n/global-require`                                       | `node/global-require`                                    |
| `n/handle-callback-err`                                  | `node/handle-callback-err`                               |
| `n/no-exports-assign`                                    | `node/no-exports-assign`                                 |
| `n/no-mixed-requires`                                    | `node/no-mixed-requires`                                 |
| `n/no-new-require`                                       | `node/no-new-require`                                    |
| `n/no-path-concat`                                       | `node/no-path-concat`                                    |
| `n/no-process-env`                                       | `node/no-process-env`                                    |
| `new-cap`                                                | `new-cap`                                                |
| `no-alert`                                               | `no-alert`                                               |
| `no-array-constructor`                                   | `no-array-constructor`                                   |
| `no-async-promise-executor`                              | `no-async-promise-executor`                              |
| `no-bitwise`                                             | `no-bitwise`                                             |
| `no-caller`                                              | `no-caller`                                              |
| `no-case-declarations`                                   | `no-case-declarations`                                   |
| `no-class-assign`                                        | `no-class-assign`                                        |
| `no-compare-neg-zero`                                    | `no-compare-neg-zero`                                    |
| `no-cond-assign`                                         | `no-cond-assign`                                         |
| `no-console`                                             | `no-console`                                             |
| `no-const-assign`                                        | `no-const-assign`                                        |
| `no-constructor-return`                                  | `no-constructor-return`                                  |
| `no-continue`                                            | `no-continue`                                            |
| `no-control-regex`                                       | `no-control-regex`                                       |
| `no-debugger`                                            | `no-debugger`                                            |
| `no-delete-var`                                          | `no-delete-var`                                          |
| `no-dupe-class-members`                                  | `no-dupe-class-members`                                  |
| `no-dupe-else-if`                                        | `no-dupe-else-if`                                        |
| `no-dupe-keys`                                           | `no-dupe-keys`                                           |
| `no-duplicate-case`                                      | `no-duplicate-case`                                      |
| `no-else-return`                                         | `no-else-return`                                         |
| `no-empty`                                               | `no-empty`                                               |
| `no-empty-character-class`                               | `no-empty-character-class`                               |
| `no-empty-pattern`                                       | `no-empty-pattern`                                       |
| `no-eval`                                                | `no-eval`                                                |
| `no-ex-assign`                                           | `no-ex-assign`                                           |
| `no-extend-native`                                       | `no-extend-native`                                       |
| `no-extra-bind`                                          | `no-extra-bind`                                          |
| `no-extra-boolean-cast`                                  | `no-extra-boolean-cast`                                  |
| `no-extra-label`                                         | `no-extra-label`                                         |
| `no-fallthrough`                                         | `no-fallthrough`                                         |
| `no-func-assign`                                         | `no-func-assign`                                         |
| `no-global-assign`                                       | `no-global-assign`                                       |
| `no-implied-eval`                                        | `no-implied-eval`                                        |
| `no-import-assign`                                       | `no-import-assign`                                       |
| `no-inner-declarations`                                  | `no-inner-declarations`                                  |
| `no-invalid-regexp`                                      | `no-invalid-regexp`                                      |
| `no-irregular-whitespace`                                | `no-irregular-whitespace`                                |
| `no-iterator`                                            | `no-iterator`                                            |
| `no-label-var`                                           | `no-label-var`                                           |
| `no-labels`                                              | `no-labels`                                              |
| `no-lone-blocks`                                         | `no-lone-blocks`                                         |
| `no-lonely-if`                                           | `no-lonely-if`                                           |
| `no-loop-func`                                           | `no-loop-func`                                           |
| `no-loss-of-precision`                                   | `no-loss-of-precision`                                   |
| `no-magic-numbers`                                       | `no-magic-numbers`                                       |
| `no-misleading-character-class`                          | `no-misleading-character-class`                          |
| `no-multi-assign`                                        | `no-multi-assign`                                        |
| `no-multi-str`                                           | `no-multi-str`                                           |
| `no-nested-ternary`                                      | `no-nested-ternary`                                      |
| `no-new`                                                 | `no-new`                                                 |
| `no-new-func`                                            | `no-new-func`                                            |
| `no-new-wrappers`                                        | `no-new-wrappers`                                        |
| `no-nonoctal-decimal-escape`                             | `no-nonoctal-decimal-escape`                             |
| `no-obj-calls`                                           | `no-obj-calls`                                           |
| `no-param-reassign`                                      | `no-param-reassign`                                      |
| `no-promise-executor-return`                             | `no-promise-executor-return`                             |
| `no-proto`                                               | `no-proto`                                               |
| `no-prototype-builtins`                                  | `no-prototype-builtins`                                  |
| `no-redeclare`                                           | `no-redeclare`                                           |
| `no-regex-spaces`                                        | `no-regex-spaces`                                        |
| `no-restricted-exports`                                  | `no-restricted-exports`                                  |
| `no-restricted-properties`                               | `no-restricted-properties`                               |
| `no-return-assign`                                       | `no-return-assign`                                       |
| `no-script-url`                                          | `no-script-url`                                          |
| `no-self-assign`                                         | `no-self-assign`                                         |
| `no-self-compare`                                        | `no-self-compare`                                        |
| `no-sequences`                                           | `no-sequences`                                           |
| `no-setter-return`                                       | `no-setter-return`                                       |
| `no-shadow`                                              | `no-shadow`                                              |
| `no-shadow-restricted-names`                             | `no-shadow-restricted-names`                             |
| `no-sparse-arrays`                                       | `no-sparse-arrays`                                       |
| `no-template-curly-in-string`                            | `no-template-curly-in-string`                            |
| `no-this-before-super`                                   | `no-this-before-super`                                   |
| `no-throw-literal`                                       | `no-throw-literal`                                       |
| `no-undef`                                               | `no-undef`                                               |
| `no-underscore-dangle`                                   | `no-underscore-dangle`                                   |
| `no-unmodified-loop-condition`                           | `no-unmodified-loop-condition`                           |
| `no-unneeded-ternary`                                    | `no-unneeded-ternary`                                    |
| `no-unreachable`                                         | `no-unreachable`                                         |
| `no-unreachable-loop`                                    | `no-unreachable-loop`                                    |
| `no-unsafe-finally`                                      | `no-unsafe-finally`                                      |
| `no-unsafe-negation`                                     | `no-unsafe-negation`                                     |
| `no-unsafe-optional-chaining`                            | `no-unsafe-optional-chaining`                            |
| `no-unused-expressions`                                  | `no-unused-expressions`                                  |
| `no-unused-labels`                                       | `no-unused-labels`                                       |
| `no-use-before-define`                                   | `no-use-before-define`                                   |
| `no-useless-backreference`                               | `no-useless-backreference`                               |
| `no-useless-call`                                        | `no-useless-call`                                        |
| `no-useless-catch`                                       | `no-useless-catch`                                       |
| `no-useless-computed-key`                                | `no-useless-computed-key`                                |
| `no-useless-concat`                                      | `no-useless-concat`                                      |
| `no-useless-rename`                                      | `no-useless-rename`                                      |
| `no-useless-return`                                      | `no-useless-return`                                      |
| `no-var`                                                 | `no-var`                                                 |
| `no-void`                                                | `no-void`                                                |
| `no-with`                                                | `no-with`                                                |
| `object-shorthand`                                       | `object-shorthand`                                       |
| `operator-assignment`                                    | `operator-assignment`                                    |
| `prefer-arrow-callback`                                  | `prefer-arrow-callback`                                  |
| `prefer-const`                                           | `prefer-const`                                           |
| `prefer-destructuring`                                   | `prefer-destructuring`                                   |
| `prefer-exponentiation-operator`                         | `prefer-exponentiation-operator`                         |
| `prefer-numeric-literals`                                | `prefer-numeric-literals`                                |
| `prefer-object-spread`                                   | `prefer-object-spread`                                   |
| `prefer-promise-reject-errors`                           | `prefer-promise-reject-errors`                           |
| `prefer-regex-literals`                                  | `prefer-regex-literals`                                  |
| `prefer-rest-params`                                     | `prefer-rest-params`                                     |
| `prefer-spread`                                          | `prefer-spread`                                          |
| `prefer-template`                                        | `prefer-template`                                        |
| `radix`                                                  | `radix`                                                  |
| `require-yield`                                          | `require-yield`                                          |
| `symbol-description`                                     | `symbol-description`                                     |
| `unicode-bom`                                            | `unicode-bom`                                            |
| `use-isnan`                                              | `use-isnan`                                              |
| `valid-typeof`                                           | `valid-typeof`                                           |
| `vars-on-top`                                            | `vars-on-top`                                            |
| `yoda`                                                   | `yoda`                                                   |
| `jsx-a11y/alt-text`                                      | `jsx-a11y/alt-text`                                      |
| `jsx-a11y/anchor-has-content`                            | `jsx-a11y/anchor-has-content`                            |
| `jsx-a11y/anchor-is-valid`                               | `jsx-a11y/anchor-is-valid`                               |
| `jsx-a11y/aria-activedescendant-has-tabindex`            | `jsx-a11y/aria-activedescendant-has-tabindex`            |
| `jsx-a11y/aria-props`                                    | `jsx-a11y/aria-props`                                    |
| `jsx-a11y/aria-proptypes`                                | `jsx-a11y/aria-proptypes`                                |
| `jsx-a11y/aria-role`                                     | `jsx-a11y/aria-role`                                     |
| `jsx-a11y/aria-unsupported-elements`                     | `jsx-a11y/aria-unsupported-elements`                     |
| `jsx-a11y/autocomplete-valid`                            | `jsx-a11y/autocomplete-valid`                            |
| `jsx-a11y/click-events-have-key-events`                  | `jsx-a11y/click-events-have-key-events`                  |
| `jsx-a11y/heading-has-content`                           | `jsx-a11y/heading-has-content`                           |
| `jsx-a11y/html-has-lang`                                 | `jsx-a11y/html-has-lang`                                 |
| `jsx-a11y/iframe-has-title`                              | `jsx-a11y/iframe-has-title`                              |
| `jsx-a11y/img-redundant-alt`                             | `jsx-a11y/img-redundant-alt`                             |
| `jsx-a11y/interactive-supports-focus`                    | `jsx-a11y/interactive-supports-focus`                    |
| `jsx-a11y/label-has-associated-control`                  | `jsx-a11y/label-has-associated-control`                  |
| `jsx-a11y/media-has-caption`                             | `jsx-a11y/media-has-caption`                             |
| `jsx-a11y/mouse-events-have-key-events`                  | `jsx-a11y/mouse-events-have-key-events`                  |
| `jsx-a11y/no-access-key`                                 | `jsx-a11y/no-access-key`                                 |
| `jsx-a11y/no-autofocus`                                  | `jsx-a11y/no-autofocus`                                  |
| `jsx-a11y/no-distracting-elements`                       | `jsx-a11y/no-distracting-elements`                       |
| `jsx-a11y/no-interactive-element-to-noninteractive-role` | `jsx-a11y/no-interactive-element-to-noninteractive-role` |
| `jsx-a11y/no-noninteractive-element-interactions`        | `jsx-a11y/no-noninteractive-element-interactions`        |
| `jsx-a11y/no-noninteractive-element-to-interactive-role` | `jsx-a11y/no-noninteractive-element-to-interactive-role` |
| `jsx-a11y/no-noninteractive-tabindex`                    | `jsx-a11y/no-noninteractive-tabindex`                    |
| `jsx-a11y/no-redundant-roles`                            | `jsx-a11y/no-redundant-roles`                            |
| `jsx-a11y/no-static-element-interactions`                | `jsx-a11y/no-static-element-interactions`                |
| `jsx-a11y/role-has-required-aria-props`                  | `jsx-a11y/role-has-required-aria-props`                  |
| `jsx-a11y/role-supports-aria-props`                      | `jsx-a11y/role-supports-aria-props`                      |
| `jsx-a11y/scope`                                         | `jsx-a11y/scope`                                         |
| `jsx-a11y/tabindex-no-positive`                          | `jsx-a11y/tabindex-no-positive`                          |
| `react-hooks/exhaustive-deps`                            | `react/exhaustive-deps`                                  |
| `react-hooks/rules-of-hooks`                             | `react/rules-of-hooks`                                   |
| `react/display-name`                                     | `react/display-name`                                     |
| `react/jsx-key`                                          | `react/jsx-key`                                          |
| `react/jsx-no-comment-textnodes`                         | `react/jsx-no-comment-textnodes`                         |
| `react/jsx-no-duplicate-props`                           | `react/jsx-no-duplicate-props`                           |
| `react/jsx-no-target-blank`                              | `react/jsx-no-target-blank`                              |
| `react/jsx-no-undef`                                     | `react/jsx-no-undef`                                     |
| `react/no-children-prop`                                 | `react/no-children-prop`                                 |
| `react/no-danger-with-children`                          | `react/no-danger-with-children`                          |
| `react/no-direct-mutation-state`                         | `react/no-direct-mutation-state`                         |
| `react/no-find-dom-node`                                 | `react/no-find-dom-node`                                 |
| `react/no-is-mounted`                                    | `react/no-is-mounted`                                    |
| `react/no-render-return-value`                           | `react/no-render-return-value`                           |
| `react/no-string-refs`                                   | `react/no-string-refs`                                   |
| `react/no-unescaped-entities`                            | `react/no-unescaped-entities`                            |
| `react/no-unknown-property`                              | `react/no-unknown-property`                              |
| `react/require-render-return`                            | `react/require-render-return`                            |

## Disabled for formatter compatibility

| ESLint rule               | Oxlint rule | Reason                       |
| ------------------------- | ----------- | ---------------------------- |
| `curly`                   | —           | Formatter owns this concern. |
| `no-unexpected-multiline` | —           | Formatter owns this concern. |

## Omitted rules

| ESLint rule                                     | Oxlint rule | Reason                                                    |
| ----------------------------------------------- | ----------- | --------------------------------------------------------- |
| `camelcase`                                     | —           | Oxlint 1.77 has no native equivalent.                     |
| `import-x/no-extraneous-dependencies`           | —           | Oxlint 1.77 has no native equivalent.                     |
| `import-x/no-import-module-exports`             | —           | Oxlint 1.77 has no native equivalent.                     |
| `import-x/no-relative-packages`                 | —           | Oxlint 1.77 has no native equivalent.                     |
| `import-x/no-unresolved`                        | —           | Oxlint 1.77 has no native equivalent.                     |
| `import-x/no-useless-path-segments`             | —           | Oxlint 1.77 has no native equivalent.                     |
| `import-x/order`                                | —           | Import ordering remains outside this package.             |
| `n/no-deprecated-api`                           | —           | Oxlint 1.77 has no native equivalent.                     |
| `n/no-extraneous-import`                        | —           | Oxlint 1.77 has no native equivalent.                     |
| `n/no-extraneous-require`                       | —           | Oxlint 1.77 has no native equivalent.                     |
| `n/no-unsupported-features/es-builtins`         | —           | Oxlint 1.77 has no native equivalent.                     |
| `n/no-unsupported-features/es-syntax`           | —           | Oxlint 1.77 has no native equivalent.                     |
| `n/no-unsupported-features/node-builtins`       | —           | Oxlint 1.77 has no native equivalent.                     |
| `n/process-exit-as-throw`                       | —           | Oxlint 1.77 has no native equivalent.                     |
| `no-dupe-args`                                  | —           | Oxlint 1.77 has no native equivalent.                     |
| `no-octal`                                      | —           | Oxlint 1.77 has no native equivalent.                     |
| `no-octal-escape`                               | —           | Oxlint 1.77 has no native equivalent.                     |
| `no-restricted-globals`                         | —           | Browser globals are provided by the browser profile.      |
| `no-restricted-syntax`                          | —           | Oxlint 1.77 has no native equivalent.                     |
| `no-undef-init`                                 | —           | Oxlint 1.77 has no native equivalent.                     |
| `one-var`                                       | —           | Oxlint 1.77 has no native equivalent.                     |
| `strict`                                        | —           | Oxlint 1.77 has no native equivalent.                     |
| `react-hooks/config`                            | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/error-boundaries`                  | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/gating`                            | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/globals`                           | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/immutability`                      | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/incompatible-library`              | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/preserve-manual-memoization`       | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/purity`                            | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/refs`                              | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/set-state-in-effect`               | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/set-state-in-render`               | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/static-components`                 | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/unsupported-syntax`                | —           | React Compiler rules are outside the initial profile.     |
| `react-hooks/use-memo`                          | —           | React Compiler rules are outside the initial profile.     |
| `react/jsx-uses-react`                          | —           | React 17+ uses the automatic JSX transform.               |
| `react/jsx-uses-vars`                           | —           | Oxlint’s unused-variable analysis recognizes JSX usage.   |
| `react/no-deprecated`                           | —           | Type-aware TypeScript provides the available replacement. |
| `react/prop-types`                              | —           | The package targets TypeScript rather than PropTypes.     |
| `jsdoc/check-access`                            | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/check-alignment`                         | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/check-param-names`                       | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/check-property-names`                    | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/check-syntax`                            | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/check-tag-names`                         | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/check-types`                             | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/implements-on-classes`                   | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/match-description`                       | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-description`                     | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-hyphen-before-param-description` | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-jsdoc`                           | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-param`                           | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-param-description`               | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-param-name`                      | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-param-type`                      | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-property`                        | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-property-description`            | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-property-name`                   | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-property-type`                   | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-returns`                         | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-returns-check`                   | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-returns-type`                    | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/require-throws`                          | —           | The initial package omits the JSDoc profile.              |
| `jsdoc/valid-types`                             | —           | The initial package omits the JSDoc profile.              |

## Profile overrides

- Browser provides the globals from the `globals` package.
- Node provides the globals from the `globals` package.
- TypeScript enables the TypeScript plugin rules.
- Tests disable `import/first`, `max-classes-per-file`, and `no-magic-numbers`.
