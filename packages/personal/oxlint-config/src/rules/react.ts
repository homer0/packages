export const react = {
  /**
   * Enforce all elements that require alternative text have meaningful information to
   * relay back to end user.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/alt-text.md
   */
  'jsx-a11y/alt-text': 'error',
  /**
   * Enforce all anchors to contain accessible content.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/anchor-has-content.md
   */
  'jsx-a11y/anchor-has-content': 'error',
  /**
   * Enforce all anchors are valid, navigable elements.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/anchor-is-valid.md
   */
  'jsx-a11y/anchor-is-valid': 'error',
  /**
   * Enforce elements with aria-activedescendant are tabbable.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/aria-activedescendant-has-tabindex.md
   */
  'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
  /**
   * Enforce all `aria-*` props are valid.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/aria-props.md
   */
  'jsx-a11y/aria-props': 'error',
  /**
   * Enforce ARIA state and property values are valid.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/aria-proptypes.md
   */
  'jsx-a11y/aria-proptypes': 'error',
  /**
   * Enforce that elements with ARIA roles must use a valid, non-abstract ARIA role.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/aria-role.md
   */
  'jsx-a11y/aria-role': 'error',
  /**
   * Enforce that elements that do not support ARIA roles, states, and properties do not
   * have those attributes.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/aria-unsupported-elements.md
   */
  'jsx-a11y/aria-unsupported-elements': 'error',
  /**
   * Enforce that autocomplete attributes are used correctly.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/autocomplete-valid.md
   */
  'jsx-a11y/autocomplete-valid': 'error',
  /**
   * Enforce a clickable non-interactive element has at least one keyboard event listener.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/click-events-have-key-events.md
   */
  'jsx-a11y/click-events-have-key-events': 'error',
  /**
   * Enforce interactive controls have an associated text label.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/control-has-associated-label.md
   */
  'jsx-a11y/control-has-associated-label': 'error',
  /**
   * Enforce heading (`h1`, `h2`, etc) elements contain accessible content.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/heading-has-content.md
   */
  'jsx-a11y/heading-has-content': 'error',
  /**
   * Enforce `<html>` element has `lang` prop.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/html-has-lang.md
   */
  'jsx-a11y/html-has-lang': 'error',
  /**
   * Enforce iframe elements have a title attribute.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/iframe-has-title.md
   */
  'jsx-a11y/iframe-has-title': 'error',
  /**
   * Enforce `<img>` alt prop does not contain the word "image", "picture", or "photo".
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/img-redundant-alt.md
   */
  'jsx-a11y/img-redundant-alt': 'error',
  /**
   * Enforce that elements with interactive handlers like `onClick` must be focusable.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/interactive-supports-focus.md
   */
  'jsx-a11y/interactive-supports-focus': [
    'error',
    {
      tabbable: [
        'button',
        'checkbox',
        'link',
        'searchbox',
        'spinbutton',
        'switch',
        'textbox',
      ],
    },
  ],
  /**
   * Enforce that a `label` tag has a text label and an associated control.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/label-has-associated-control.md
   */
  'jsx-a11y/label-has-associated-control': 'error',
  /**
   * Enforces that `<audio>` and `<video>` elements must have a `<track>` for captions.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/media-has-caption.md
   */
  'jsx-a11y/media-has-caption': 'error',
  /**
   * Enforce that `onMouseOver`/`onMouseOut` are accompanied by `onFocus`/`onBlur` for
   * keyboard-only users.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/mouse-events-have-key-events.md
   */
  'jsx-a11y/mouse-events-have-key-events': 'error',
  /**
   * Enforce that the `accessKey` prop is not used on any element to avoid complications
   * with keyboard commands used by a screen reader.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-access-key.md
   */
  'jsx-a11y/no-access-key': 'error',
  /**
   * Enforce autoFocus prop is not used.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-autofocus.md
   */
  'jsx-a11y/no-autofocus': 'error',
  /**
   * Enforce distracting elements are not used.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-distracting-elements.md
   */
  'jsx-a11y/no-distracting-elements': 'error',
  /**
   * Interactive elements should not be assigned non-interactive roles.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-interactive-element-to-noninteractive-role.md
   */
  'jsx-a11y/no-interactive-element-to-noninteractive-role': [
    'error',
    {
      tr: ['none', 'presentation'],
      canvas: ['img'],
    },
  ],
  /**
   * Non-interactive elements should not be assigned mouse or keyboard event listeners.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-noninteractive-element-interactions.md
   */
  'jsx-a11y/no-noninteractive-element-interactions': [
    'error',
    {
      handlers: [
        'onClick',
        'onError',
        'onLoad',
        'onMouseDown',
        'onMouseUp',
        'onKeyPress',
        'onKeyDown',
        'onKeyUp',
      ],
      alert: ['onKeyUp', 'onKeyDown', 'onKeyPress'],
      body: ['onError', 'onLoad'],
      dialog: ['onKeyUp', 'onKeyDown', 'onKeyPress'],
      iframe: ['onError', 'onLoad'],
      img: ['onError', 'onLoad'],
    },
  ],
  /**
   * Non-interactive elements should not be assigned interactive roles.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-noninteractive-element-to-interactive-role.md
   */
  'jsx-a11y/no-noninteractive-element-to-interactive-role': [
    'error',
    {
      ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
      ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
      li: [
        'menuitem',
        'menuitemradio',
        'menuitemcheckbox',
        'option',
        'row',
        'tab',
        'treeitem',
      ],
      table: ['grid'],
      td: ['gridcell'],
      fieldset: ['radiogroup', 'presentation'],
    },
  ],
  /**
   * `tabIndex` should only be declared on interactive elements.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-noninteractive-tabindex.md
   */
  'jsx-a11y/no-noninteractive-tabindex': [
    'error',
    {
      tags: [],
      roles: ['tabpanel'],
      allowExpressionValues: true,
    },
  ],
  /**
   * Enforce explicit role property is not the same as implicit/default role property on
   * element.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-redundant-roles.md
   */
  'jsx-a11y/no-redundant-roles': 'error',
  /**
   * Enforce that non-interactive, visible elements (such as `<div>`) that have click
   * handlers use the role attribute.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-static-element-interactions.md
   */
  'jsx-a11y/no-static-element-interactions': [
    'error',
    {
      allowExpressionValues: true,
      handlers: [
        'onClick',
        'onMouseDown',
        'onMouseUp',
        'onKeyPress',
        'onKeyDown',
        'onKeyUp',
      ],
    },
  ],
  /**
   * Enforce that elements with ARIA roles must have all required attributes for that
   * role.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/role-has-required-aria-props.md
   */
  'jsx-a11y/role-has-required-aria-props': 'error',
  /**
   * Enforce that elements with explicit or implicit roles defined contain only `aria-*`
   * properties supported by that `role`.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/role-supports-aria-props.md
   */
  'jsx-a11y/role-supports-aria-props': 'error',
  /**
   * Enforce `scope` prop is only used on `<th>` elements.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/scope.md
   */
  'jsx-a11y/scope': 'error',
  /**
   * Enforce `tabIndex` value is not greater than zero.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/tabindex-no-positive.md
   */
  'jsx-a11y/tabindex-no-positive': 'error',
  /**
   * Disallow missing displayName in a React component definition.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/display-name.md
   */
  'react/display-name': 2,
  /**
   * Disallow missing `key` props in iterators/collection literals.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-key.md
   */
  'react/jsx-key': 2,
  /**
   * Disallow comments from being inserted as text nodes.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-comment-textnodes.md
   */
  'react/jsx-no-comment-textnodes': 2,
  /**
   * Disallow duplicate properties in JSX.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-duplicate-props.md
   */
  'react/jsx-no-duplicate-props': 2,
  /**
   * Disallow `target="_blank"` attribute without `rel="noreferrer"`
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-target-blank.md
   */
  'react/jsx-no-target-blank': 2,
  /**
   * Disallow undeclared variables in JSX.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-undef.md
   */
  'react/jsx-no-undef': 2,
  /**
   * Disallow passing of children as props.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-children-prop.md
   */
  'react/no-children-prop': 2,
  /**
   * Disallow when a DOM element is using both children and dangerouslySetInnerHTML.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-danger-with-children.md
   */
  'react/no-danger-with-children': 2,
  /**
   * Disallow direct mutation of this.state.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-direct-mutation-state.md
   */
  'react/no-direct-mutation-state': 2,
  /**
   * Disallow usage of findDOMNode.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-find-dom-node.md
   */
  'react/no-find-dom-node': 2,
  /**
   * Disallow usage of isMounted.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-is-mounted.md
   */
  'react/no-is-mounted': 2,
  /**
   * Disallow usage of the return value of ReactDOM.render.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-render-return-value.md
   */
  'react/no-render-return-value': 2,
  /**
   * Disallow using string references.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-string-refs.md
   */
  'react/no-string-refs': 2,
  /**
   * Disallow unescaped HTML entities from appearing in markup.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unescaped-entities.md
   */
  'react/no-unescaped-entities': 2,
  /**
   * Disallow usage of unknown DOM property.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unknown-property.md
   */
  'react/no-unknown-property': 2,
  /**
   * Enforce ES5 or ES6 class for returning value in render function.
   *
   * @see https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/require-render-return.md
   */
  'react/require-render-return': 2,
  /**
   * Enforces the Rules of Hooks.
   *
   * @see https://react.dev/reference/rules/rules-of-hooks
   */
  'react/rules-of-hooks': 'error',
  /**
   * Verifies the list of dependencies for Hooks like useEffect and similar.
   *
   * @see https://github.com/facebook/react/issues/14920
   */
  'react/exhaustive-deps': 'warn',
  /**
   * Disallow new arrays passed directly as JSX props.
   *
   * @see https://github.com/cvazac/eslint-plugin-react-perf/blob/master/docs/rules/jsx-no-new-array-as-prop.md
   */
  'react-perf/jsx-no-new-array-as-prop': 'error',
  /**
   * Disallow new functions passed directly as JSX props.
   *
   * @see https://github.com/cvazac/eslint-plugin-react-perf/blob/master/docs/rules/jsx-no-new-function-as-prop.md
   */
  'react-perf/jsx-no-new-function-as-prop': 'error',
  /**
   * Disallow new objects passed directly as JSX props.
   *
   * @see https://github.com/cvazac/eslint-plugin-react-perf/blob/master/docs/rules/jsx-no-new-object-as-prop.md
   */
  'react-perf/jsx-no-new-object-as-prop': 'error',
  /**
   * Allow React components to reference declarations defined later in the file.
   *
   * @see https://eslint.org/docs/latest/rules/no-use-before-define
   */
  'no-use-before-define': 'off',
} as const;
