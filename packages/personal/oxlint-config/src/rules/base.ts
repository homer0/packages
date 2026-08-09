export const base = {
  /**
   * Enforce `return` statements in callbacks of array methods.
   *
   * @see https://eslint.org/docs/latest/rules/array-callback-return
   */
  'array-callback-return': [
    'error',
    {
      allowImplicit: true,
    },
  ],
  /**
   * Enforce the use of variables within the scope they are defined.
   *
   * @see https://eslint.org/docs/latest/rules/block-scoped-var
   */
  'block-scoped-var': 'error',
  /**
   * Enforce a maximum cyclomatic complexity allowed in a program.
   *
   * @see https://eslint.org/docs/latest/rules/complexity
   */
  complexity: ['warn', 30],
  /**
   * Require `return` statements to either always or never specify values.
   *
   * @see https://eslint.org/docs/latest/rules/consistent-return
   */
  'consistent-return': 'error',
  /**
   * Enforce consistent brace style for all control statements.
   *
   * @see https://eslint.org/docs/latest/rules/curly
   */
  curly: 'off',
  /**
   * Require `default` cases in `switch` statements.
   *
   * @see https://eslint.org/docs/latest/rules/default-case
   */
  'default-case': [
    'error',
    {
      commentPattern: '^no default$',
    },
  ],
  /**
   * Enforce `default` clauses in `switch` statements to be last.
   *
   * @see https://eslint.org/docs/latest/rules/default-case-last
   */
  'default-case-last': 'error',
  /**
   * Enforce default parameters to be last.
   *
   * @see https://eslint.org/docs/latest/rules/default-param-last
   */
  'default-param-last': 'error',
  /**
   * Enforce dot notation whenever possible.
   *
   * @see https://eslint.org/docs/latest/rules/dot-notation
   */
  'dot-notation': [
    'error',
    {
      allowKeywords: true,
    },
  ],
  /**
   * Require the use of `===` and `!==`
   *
   * @see https://eslint.org/docs/latest/rules/eqeqeq
   */
  eqeqeq: [
    'error',
    'always',
    {
      null: 'ignore',
    },
  ],
  /**
   * Require grouped accessor pairs in object literals and classes.
   *
   * @see https://eslint.org/docs/latest/rules/grouped-accessor-pairs
   */
  'grouped-accessor-pairs': 'error',
  /**
   * Require `for-in` loops to include an `if` statement.
   *
   * @see https://eslint.org/docs/latest/rules/guard-for-in
   */
  'guard-for-in': 'error',
  /**
   * Enforce a maximum number of classes per file.
   *
   * @see https://eslint.org/docs/latest/rules/max-classes-per-file
   */
  'max-classes-per-file': ['error', 1],
  /**
   * Disallow the use of `alert`, `confirm`, and `prompt`
   *
   * @see https://eslint.org/docs/latest/rules/no-alert
   */
  'no-alert': 'warn',
  /**
   * Disallow the use of `arguments.caller` or `arguments.callee`
   *
   * @see https://eslint.org/docs/latest/rules/no-caller
   */
  'no-caller': 'error',
  /**
   * Disallow lexical declarations in case clauses.
   *
   * @see https://eslint.org/docs/latest/rules/no-case-declarations
   */
  'no-case-declarations': 'error',
  /**
   * Disallow returning value from constructor.
   *
   * @see https://eslint.org/docs/latest/rules/no-constructor-return
   */
  'no-constructor-return': 'error',
  /**
   * Disallow `else` blocks after `return` statements in `if` statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-else-return
   */
  'no-else-return': [
    'error',
    {
      allowElseIf: false,
    },
  ],
  /**
   * Disallow empty functions.
   *
   * @see https://eslint.org/docs/latest/rules/no-empty-function
   */
  'no-empty-function': [
    'error',
    {
      allow: ['arrowFunctions', 'functions', 'methods'],
    },
  ],
  /**
   * Disallow empty destructuring patterns.
   *
   * @see https://eslint.org/docs/latest/rules/no-empty-pattern
   */
  'no-empty-pattern': 'error',
  /**
   * Disallow the use of `eval()`
   *
   * @see https://eslint.org/docs/latest/rules/no-eval
   */
  'no-eval': 'error',
  /**
   * Disallow extending native types.
   *
   * @see https://eslint.org/docs/latest/rules/no-extend-native
   */
  'no-extend-native': 'error',
  /**
   * Disallow unnecessary calls to `.bind()`
   *
   * @see https://eslint.org/docs/latest/rules/no-extra-bind
   */
  'no-extra-bind': 'error',
  /**
   * Disallow unnecessary labels.
   *
   * @see https://eslint.org/docs/latest/rules/no-extra-label
   */
  'no-extra-label': 'error',
  /**
   * Disallow fallthrough of `case` statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-fallthrough
   */
  'no-fallthrough': 'error',
  /**
   * Disallow assignments to native objects or read-only global variables.
   *
   * @see https://eslint.org/docs/latest/rules/no-global-assign
   */
  'no-global-assign': [
    'error',
    {
      exceptions: [],
    },
  ],
  /**
   * Disallow the use of `eval()`-like methods.
   *
   * @see https://eslint.org/docs/latest/rules/no-implied-eval
   */
  'no-implied-eval': 'error',
  /**
   * Disallow the use of the `__iterator__` property.
   *
   * @see https://eslint.org/docs/latest/rules/no-iterator
   */
  'no-iterator': 'error',
  /**
   * Disallow labeled statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-labels
   */
  'no-labels': [
    'error',
    {
      allowLoop: false,
      allowSwitch: false,
    },
  ],
  /**
   * Disallow unnecessary nested blocks.
   *
   * @see https://eslint.org/docs/latest/rules/no-lone-blocks
   */
  'no-lone-blocks': 'error',
  /**
   * Disallow function declarations that contain unsafe references inside loop statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-loop-func
   */
  'no-loop-func': 'error',
  /**
   * Disallow magic numbers.
   *
   * @see https://eslint.org/docs/latest/rules/no-magic-numbers
   */
  'no-magic-numbers': [
    'error',
    {
      ignore: [0, 1, -1, 60, 100, 1000],
      ignoreArrayIndexes: true,
      enforceConst: false,
      detectObjects: false,
    },
  ],
  /**
   * Disallow multiline strings.
   *
   * @see https://eslint.org/docs/latest/rules/no-multi-str
   */
  'no-multi-str': 'error',
  /**
   * Disallow `new` operators outside of assignments or comparisons.
   *
   * @see https://eslint.org/docs/latest/rules/no-new
   */
  'no-new': 'error',
  /**
   * Disallow `new` operators with the `Function` object.
   *
   * @see https://eslint.org/docs/latest/rules/no-new-func
   */
  'no-new-func': 'error',
  /**
   * Disallow `new` operators with the `String`, `Number`, and `Boolean` objects.
   *
   * @see https://eslint.org/docs/latest/rules/no-new-wrappers
   */
  'no-new-wrappers': 'error',
  /**
   * Disallow `\8` and `\9` escape sequences in string literals.
   *
   * @see https://eslint.org/docs/latest/rules/no-nonoctal-decimal-escape
   */
  'no-nonoctal-decimal-escape': 'error',
  /**
   * Disallow reassigning function parameters.
   *
   * @see https://eslint.org/docs/latest/rules/no-param-reassign
   */
  'no-param-reassign': [
    'error',
    {
      props: true,
      ignorePropertyModificationsFor: [
        'acc',
        'accumulator',
        'e',
        'ctx',
        'context',
        'req',
        'request',
        'res',
        'response',
        '$scope',
        'staticContext',
        'state',
        'ref',
        'sacc',
      ],
    },
  ],
  /**
   * Disallow the use of the `__proto__` property.
   *
   * @see https://eslint.org/docs/latest/rules/no-proto
   */
  'no-proto': 'error',
  /**
   * Disallow variable redeclaration.
   *
   * @see https://eslint.org/docs/latest/rules/no-redeclare
   */
  'no-redeclare': 'error',
  /**
   * Disallow certain properties on certain objects.
   *
   * @see https://eslint.org/docs/latest/rules/no-restricted-properties
   */
  'no-restricted-properties': [
    'error',
    {
      object: 'arguments',
      property: 'callee',
      message: 'arguments.callee is deprecated',
    },
    {
      object: 'global',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    },
    {
      object: 'self',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    },
    {
      object: 'window',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    },
    {
      object: 'global',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    },
    {
      object: 'self',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    },
    {
      object: 'window',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    },
    {
      property: '__defineGetter__',
      message: 'Please use Object.defineProperty instead.',
    },
    {
      property: '__defineSetter__',
      message: 'Please use Object.defineProperty instead.',
    },
    {
      object: 'Math',
      property: 'pow',
      message: 'Use the exponentiation operator (**) instead.',
    },
  ],
  /**
   * Disallow assignment operators in `return` statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-return-assign
   */
  'no-return-assign': ['error', 'always'],
  /**
   * Disallow `javascript:` URLs.
   *
   * @see https://eslint.org/docs/latest/rules/no-script-url
   */
  'no-script-url': 'error',
  /**
   * Disallow assignments where both sides are exactly the same.
   *
   * @see https://eslint.org/docs/latest/rules/no-self-assign
   */
  'no-self-assign': [
    'error',
    {
      props: true,
    },
  ],
  /**
   * Disallow comparisons where both sides are exactly the same.
   *
   * @see https://eslint.org/docs/latest/rules/no-self-compare
   */
  'no-self-compare': 'error',
  /**
   * Disallow comma operators.
   *
   * @see https://eslint.org/docs/latest/rules/no-sequences
   */
  'no-sequences': 'error',
  /**
   * Disallow throwing literals as exceptions.
   *
   * @see https://eslint.org/docs/latest/rules/no-throw-literal
   */
  'no-throw-literal': 'error',
  /**
   * Disallow unmodified loop conditions.
   *
   * @see https://eslint.org/docs/latest/rules/no-unmodified-loop-condition
   */
  'no-unmodified-loop-condition': 'error',
  /**
   * Disallow unused expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-unused-expressions
   */
  'no-unused-expressions': [
    'error',
    {
      allowShortCircuit: false,
      allowTernary: false,
      allowTaggedTemplates: false,
    },
  ],
  /**
   * Disallow unused labels.
   *
   * @see https://eslint.org/docs/latest/rules/no-unused-labels
   */
  'no-unused-labels': 'error',
  /**
   * Disallow unnecessary calls to `.call()` and `.apply()`
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-call
   */
  'no-useless-call': 'error',
  /**
   * Disallow unnecessary `catch` clauses.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-catch
   */
  'no-useless-catch': 'error',
  /**
   * Disallow unnecessary concatenation of literals or template literals.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-concat
   */
  'no-useless-concat': 'error',
  /**
   * Disallow redundant return statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-return
   */
  'no-useless-return': 'error',
  /**
   * Disallow `void` operators.
   *
   * @see https://eslint.org/docs/latest/rules/no-void
   */
  'no-void': 'error',
  /**
   * Disallow `with` statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-with
   */
  'no-with': 'error',
  /**
   * Require using Error objects as Promise rejection reasons.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-promise-reject-errors
   */
  'prefer-promise-reject-errors': [
    'error',
    {
      allowEmptyReject: true,
    },
  ],
  /**
   * Disallow use of the `RegExp` constructor in favor of regular expression literals.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-regex-literals
   */
  'prefer-regex-literals': [
    'error',
    {
      disallowRedundantWrapping: true,
    },
  ],
  /**
   * Enforce the consistent use of the radix argument when using `parseInt()`
   *
   * @see https://eslint.org/docs/latest/rules/radix
   */
  radix: 'error',
  /**
   * Require `var` declarations be placed at the top of their containing scope.
   *
   * @see https://eslint.org/docs/latest/rules/vars-on-top
   */
  'vars-on-top': 'error',
  /**
   * Require or disallow "Yoda" conditions.
   *
   * @see https://eslint.org/docs/latest/rules/yoda
   */
  yoda: 'error',
  /**
   * Enforce `for` loop update clause moving the counter in the right direction.
   *
   * @see https://eslint.org/docs/latest/rules/for-direction
   */
  'for-direction': 'error',
  /**
   * Enforce `return` statements in getters.
   *
   * @see https://eslint.org/docs/latest/rules/getter-return
   */
  'getter-return': [
    'error',
    {
      allowImplicit: true,
    },
  ],
  /**
   * Disallow using an async function as a Promise executor.
   *
   * @see https://eslint.org/docs/latest/rules/no-async-promise-executor
   */
  'no-async-promise-executor': 'error',
  /**
   * Disallow comparing against `-0`
   *
   * @see https://eslint.org/docs/latest/rules/no-compare-neg-zero
   */
  'no-compare-neg-zero': 'error',
  /**
   * Disallow assignment operators in conditional expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-cond-assign
   */
  'no-cond-assign': ['error', 'always'],
  /**
   * Disallow the use of `console`
   *
   * @see https://eslint.org/docs/latest/rules/no-console
   */
  'no-console': 'warn',
  /**
   * Disallow control characters in regular expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-control-regex
   */
  'no-control-regex': 'error',
  /**
   * Disallow the use of `debugger`
   *
   * @see https://eslint.org/docs/latest/rules/no-debugger
   */
  'no-debugger': 'error',
  /**
   * Disallow duplicate conditions in if-else-if chains.
   *
   * @see https://eslint.org/docs/latest/rules/no-dupe-else-if
   */
  'no-dupe-else-if': 'error',
  /**
   * Disallow duplicate keys in object literals.
   *
   * @see https://eslint.org/docs/latest/rules/no-dupe-keys
   */
  'no-dupe-keys': 'error',
  /**
   * Disallow duplicate case labels.
   *
   * @see https://eslint.org/docs/latest/rules/no-duplicate-case
   */
  'no-duplicate-case': 'error',
  /**
   * Disallow empty block statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-empty
   */
  'no-empty': 'error',
  /**
   * Disallow empty character classes in regular expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-empty-character-class
   */
  'no-empty-character-class': 'error',
  /**
   * Disallow reassigning exceptions in `catch` clauses.
   *
   * @see https://eslint.org/docs/latest/rules/no-ex-assign
   */
  'no-ex-assign': 'error',
  /**
   * Disallow unnecessary boolean casts.
   *
   * @see https://eslint.org/docs/latest/rules/no-extra-boolean-cast
   */
  'no-extra-boolean-cast': 'error',
  /**
   * Disallow reassigning `function` declarations.
   *
   * @see https://eslint.org/docs/latest/rules/no-func-assign
   */
  'no-func-assign': 'error',
  /**
   * Disallow assigning to imported bindings.
   *
   * @see https://eslint.org/docs/latest/rules/no-import-assign
   */
  'no-import-assign': 'error',
  /**
   * Disallow variable or `function` declarations in nested blocks.
   *
   * @see https://eslint.org/docs/latest/rules/no-inner-declarations
   */
  'no-inner-declarations': 'error',
  /**
   * Disallow invalid regular expression strings in `RegExp` constructors.
   *
   * @see https://eslint.org/docs/latest/rules/no-invalid-regexp
   */
  'no-invalid-regexp': 'error',
  /**
   * Disallow irregular whitespace.
   *
   * @see https://eslint.org/docs/latest/rules/no-irregular-whitespace
   */
  'no-irregular-whitespace': 'error',
  /**
   * Disallow literal numbers that lose precision.
   *
   * @see https://eslint.org/docs/latest/rules/no-loss-of-precision
   */
  'no-loss-of-precision': 'error',
  /**
   * Disallow characters which are made with multiple code points in character class
   * syntax.
   *
   * @see https://eslint.org/docs/latest/rules/no-misleading-character-class
   */
  'no-misleading-character-class': 'error',
  /**
   * Disallow calling global object properties as functions.
   *
   * @see https://eslint.org/docs/latest/rules/no-obj-calls
   */
  'no-obj-calls': 'error',
  /**
   * Disallow returning values from Promise executor functions.
   *
   * @see https://eslint.org/docs/latest/rules/no-promise-executor-return
   */
  'no-promise-executor-return': 'error',
  /**
   * Disallow calling some `Object.prototype` methods directly on objects.
   *
   * @see https://eslint.org/docs/latest/rules/no-prototype-builtins
   */
  'no-prototype-builtins': 'error',
  /**
   * Disallow multiple spaces in regular expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-regex-spaces
   */
  'no-regex-spaces': 'error',
  /**
   * Disallow returning values from setters.
   *
   * @see https://eslint.org/docs/latest/rules/no-setter-return
   */
  'no-setter-return': 'error',
  /**
   * Disallow sparse arrays.
   *
   * @see https://eslint.org/docs/latest/rules/no-sparse-arrays
   */
  'no-sparse-arrays': 'error',
  /**
   * Disallow template literal placeholder syntax in regular strings.
   *
   * @see https://eslint.org/docs/latest/rules/no-template-curly-in-string
   */
  'no-template-curly-in-string': 'error',
  /**
   * Disallow confusing multiline expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-unexpected-multiline
   */
  'no-unexpected-multiline': 'off',
  /**
   * Disallow unreachable code after `return`, `throw`, `continue`, and `break`
   * statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-unreachable
   */
  'no-unreachable': 'error',
  /**
   * Disallow loops with a body that allows only one iteration.
   *
   * @see https://eslint.org/docs/latest/rules/no-unreachable-loop
   */
  'no-unreachable-loop': [
    'error',
    {
      ignore: [],
    },
  ],
  /**
   * Disallow control flow statements in `finally` blocks.
   *
   * @see https://eslint.org/docs/latest/rules/no-unsafe-finally
   */
  'no-unsafe-finally': 'error',
  /**
   * Disallow negating the left operand of relational operators.
   *
   * @see https://eslint.org/docs/latest/rules/no-unsafe-negation
   */
  'no-unsafe-negation': 'error',
  /**
   * Disallow use of optional chaining in contexts where the `undefined` value is not
   * allowed.
   *
   * @see https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining
   */
  'no-unsafe-optional-chaining': [
    'error',
    {
      disallowArithmeticOperators: true,
    },
  ],
  /**
   * Disallow useless backreferences in regular expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-backreference
   */
  'no-useless-backreference': 'error',
  /**
   * Require calls to `isNaN()` when checking for `NaN`
   *
   * @see https://eslint.org/docs/latest/rules/use-isnan
   */
  'use-isnan': 'error',
  /**
   * Enforce comparing `typeof` expressions against valid strings.
   *
   * @see https://eslint.org/docs/latest/rules/valid-typeof
   */
  'valid-typeof': [
    'error',
    {
      requireStringLiterals: true,
    },
  ],
  /**
   * Require or disallow named `function` expressions.
   *
   * @see https://eslint.org/docs/latest/rules/func-names
   */
  'func-names': 'warn',
  /**
   * Require constructor names to begin with a capital letter.
   *
   * @see https://eslint.org/docs/latest/rules/new-cap
   */
  'new-cap': [
    'error',
    {
      newIsCap: true,
      newIsCapExceptions: [],
      capIsNew: false,
      capIsNewExceptions: ['Immutable.Map', 'Immutable.Set', 'Immutable.List'],
    },
  ],
  /**
   * Disallow `Array` constructors.
   *
   * @see https://eslint.org/docs/latest/rules/no-array-constructor
   */
  'no-array-constructor': 'error',
  /**
   * Disallow bitwise operators.
   *
   * @see https://eslint.org/docs/latest/rules/no-bitwise
   */
  'no-bitwise': 'error',
  /**
   * Disallow `continue` statements.
   *
   * @see https://eslint.org/docs/latest/rules/no-continue
   */
  'no-continue': 'error',
  /**
   * Disallow `if` statements as the only statement in `else` blocks.
   *
   * @see https://eslint.org/docs/latest/rules/no-lonely-if
   */
  'no-lonely-if': 'error',
  /**
   * Disallow use of chained assignment expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-multi-assign
   */
  'no-multi-assign': ['error'],
  /**
   * Disallow nested ternary expressions.
   *
   * @see https://eslint.org/docs/latest/rules/no-nested-ternary
   */
  'no-nested-ternary': 'error',
  /**
   * Disallow dangling underscores in identifiers.
   *
   * @see https://eslint.org/docs/latest/rules/no-underscore-dangle
   */
  'no-underscore-dangle': [
    'error',
    {
      allow: ['__'],
      allowAfterThis: true,
      allowAfterSuper: true,
      enforceInMethodNames: false,
    },
  ],
  /**
   * Disallow ternary operators when simpler alternatives exist.
   *
   * @see https://eslint.org/docs/latest/rules/no-unneeded-ternary
   */
  'no-unneeded-ternary': [
    'error',
    {
      defaultAssignment: false,
    },
  ],
  /**
   * Require or disallow assignment operator shorthand where possible.
   *
   * @see https://eslint.org/docs/latest/rules/operator-assignment
   */
  'operator-assignment': ['error', 'always'],
  /**
   * Disallow the use of `Math.pow` in favor of the `**` operator.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-exponentiation-operator
   */
  'prefer-exponentiation-operator': 'error',
  /**
   * Disallow using `Object.assign` with an object literal as the first argument and
   * prefer the use of object spread instead.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-object-spread
   */
  'prefer-object-spread': 'error',
  /**
   * Require or disallow Unicode byte order mark (BOM)
   *
   * @see https://eslint.org/docs/latest/rules/unicode-bom
   */
  'unicode-bom': ['error', 'never'],
  /**
   * Disallow deleting variables.
   *
   * @see https://eslint.org/docs/latest/rules/no-delete-var
   */
  'no-delete-var': 'error',
  /**
   * Disallow labels that share a name with a variable.
   *
   * @see https://eslint.org/docs/latest/rules/no-label-var
   */
  'no-label-var': 'error',
  /**
   * Disallow variable declarations from shadowing variables declared in the outer scope.
   *
   * @see https://eslint.org/docs/latest/rules/no-shadow
   */
  'no-shadow': 'error',
  /**
   * Disallow identifiers from shadowing restricted names.
   *
   * @see https://eslint.org/docs/latest/rules/no-shadow-restricted-names
   */
  'no-shadow-restricted-names': 'error',
  /**
   * Disallow the use of undeclared variables unless mentioned in `/*global * /` comments.
   *
   * @see https://eslint.org/docs/latest/rules/no-undef
   */
  'no-undef': 'error',
  /**
   * Disallow unused variables.
   *
   * @see https://eslint.org/docs/latest/rules/no-unused-vars
   */
  'no-unused-vars': [
    'error',
    {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
    },
  ],
  /**
   * Disallow the use of variables before they are defined.
   *
   * @see https://eslint.org/docs/latest/rules/no-use-before-define
   */
  'no-use-before-define': [
    'error',
    {
      functions: true,
      classes: true,
      variables: true,
    },
  ],
  /**
   * Require braces around arrow function bodies.
   *
   * @see https://eslint.org/docs/latest/rules/arrow-body-style
   */
  'arrow-body-style': [
    'error',
    'as-needed',
    {
      requireReturnForObjectLiteral: false,
    },
  ],
  /**
   * Require `super()` calls in constructors.
   *
   * @see https://eslint.org/docs/latest/rules/constructor-super
   */
  'constructor-super': 'error',
  /**
   * Disallow reassigning class members.
   *
   * @see https://eslint.org/docs/latest/rules/no-class-assign
   */
  'no-class-assign': 'error',
  /**
   * Disallow reassigning `const`, `using`, and `await using` variables.
   *
   * @see https://eslint.org/docs/latest/rules/no-const-assign
   */
  'no-const-assign': 'error',
  /**
   * Disallow duplicate class members.
   *
   * @see https://eslint.org/docs/latest/rules/no-dupe-class-members
   */
  'no-dupe-class-members': 'error',
  /**
   * Disallow specified names in exports.
   *
   * @see https://eslint.org/docs/latest/rules/no-restricted-exports
   */
  'no-restricted-exports': [
    'error',
    {
      restrictedNamedExports: ['default', 'then'],
    },
  ],
  /**
   * Disallow `this`/`super` before calling `super()` in constructors.
   *
   * @see https://eslint.org/docs/latest/rules/no-this-before-super
   */
  'no-this-before-super': 'error',
  /**
   * Disallow unnecessary computed property keys in objects and classes.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-computed-key
   */
  'no-useless-computed-key': 'error',
  /**
   * Disallow unnecessary constructors.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-constructor
   */
  'no-useless-constructor': 'error',
  /**
   * Disallow renaming import, export, and destructured assignments to the same name.
   *
   * @see https://eslint.org/docs/latest/rules/no-useless-rename
   */
  'no-useless-rename': [
    'error',
    {
      ignoreDestructuring: false,
      ignoreImport: false,
      ignoreExport: false,
    },
  ],
  /**
   * Require `let` or `const` instead of `var`
   *
   * @see https://eslint.org/docs/latest/rules/no-var
   */
  'no-var': 'error',
  /**
   * Require or disallow method and property shorthand syntax for object literals.
   *
   * @see https://eslint.org/docs/latest/rules/object-shorthand
   */
  'object-shorthand': [
    'error',
    'always',
    {
      ignoreConstructors: false,
      avoidQuotes: true,
    },
  ],
  /**
   * Require using arrow functions for callbacks.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-arrow-callback
   */
  'prefer-arrow-callback': [
    'error',
    {
      allowNamedFunctions: false,
      allowUnboundThis: true,
    },
  ],
  /**
   * Require `const` declarations for variables that are never reassigned after declared.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-const
   */
  'prefer-const': [
    'error',
    {
      destructuring: 'any',
      ignoreReadBeforeAssign: true,
    },
  ],
  /**
   * Require destructuring from arrays and/or objects.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-destructuring
   */
  'prefer-destructuring': [
    'error',
    {
      VariableDeclarator: {
        array: false,
        object: true,
      },
      AssignmentExpression: {
        array: true,
        object: false,
      },
    },
    {
      enforceForRenamedProperties: false,
    },
  ],
  /**
   * Disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and
   * hexadecimal literals.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-numeric-literals
   */
  'prefer-numeric-literals': 'error',
  /**
   * Require rest parameters instead of `arguments`
   *
   * @see https://eslint.org/docs/latest/rules/prefer-rest-params
   */
  'prefer-rest-params': 'error',
  /**
   * Require spread operators instead of `.apply()`
   *
   * @see https://eslint.org/docs/latest/rules/prefer-spread
   */
  'prefer-spread': 'error',
  /**
   * Require template literals instead of string concatenation.
   *
   * @see https://eslint.org/docs/latest/rules/prefer-template
   */
  'prefer-template': 'error',
  /**
   * Require generator functions to contain `yield`
   *
   * @see https://eslint.org/docs/latest/rules/require-yield
   */
  'require-yield': 'error',
  /**
   * Require symbol descriptions.
   *
   * @see https://eslint.org/docs/latest/rules/symbol-description
   */
  'symbol-description': 'error',
  /**
   * Ensure named imports correspond to a named export in the remote file.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/named.md
   */
  'import/named': 'error',
  /**
   * Forbid any invalid exports, i.e. re-export of the same name.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/export.md
   */
  'import/export': 'error',
  /**
   * Forbid use of exported name as identifier of default export.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-named-as-default.md
   */
  'import/no-named-as-default': 'error',
  /**
   * Forbid use of exported name as property of default export.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-named-as-default-member.md
   */
  'import/no-named-as-default-member': 'error',
  /**
   * Forbid the use of mutable exports with `var` or `let`.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-mutable-exports.md
   */
  'import/no-mutable-exports': 'error',
  /**
   * Forbid AMD `require` and `define` calls.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-amd.md
   */
  'import/no-amd': 'error',
  /**
   * Ensure all imports appear before other statements.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/first.md
   */
  'import/first': 'error',
  /**
   * Forbid repeated import of the same module in multiple places.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-duplicates.md
   */
  'import/no-duplicates': 'error',
  /**
   * Ensure consistent use of file extension within the import path.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/extensions.md
   */
  'import/extensions': [
    'error',
    'ignorePackages',
    {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
    },
  ],
  /**
   * Enforce a newline after import statements.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/newline-after-import.md
   */
  'import/newline-after-import': 'error',
  /**
   * Forbid import of modules using absolute paths.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-absolute-path.md
   */
  'import/no-absolute-path': 'error',
  /**
   * Forbid `require()` calls with expressions.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-dynamic-require.md
   */
  'import/no-dynamic-require': 'error',
  /**
   * Forbid webpack loader syntax in imports.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-webpack-loader-syntax.md
   */
  'import/no-webpack-loader-syntax': 'error',
  /**
   * Forbid named default exports.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-named-default.md
   */
  'import/no-named-default': 'error',
  /**
   * Forbid a module from importing itself.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-self-import.md
   */
  'import/no-self-import': 'error',
  /**
   * Forbid a module from importing a module with a dependency path back to itself.
   *
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-cycle.md
   */
  'import/no-cycle': [
    'error',
    {
      maxDepth: 4294967295,
    },
  ],
} as const;
