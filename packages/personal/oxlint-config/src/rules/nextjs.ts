export const nextjs = {
  /**
   * Require Google Fonts to use an allowed display strategy.
   *
   * @see https://nextjs.org/docs/messages/google-font-display
   */
  'nextjs/google-font-display': 'warn',
  /**
   * Require preconnect for Google Fonts.
   *
   * @see https://nextjs.org/docs/messages/google-font-preconnect
   */
  'nextjs/google-font-preconnect': 'warn',
  /**
   * Require an ID for inline Next.js scripts.
   *
   * @see https://nextjs.org/docs/messages/inline-script-id
   */
  'nextjs/inline-script-id': 'error',
  /**
   * Prefer `next/script` for Google Analytics.
   *
   * @see https://nextjs.org/docs/messages/next-script-for-ga
   */
  'nextjs/next-script-for-ga': 'warn',
  /**
   * Disallow assigning to the `module` variable.
   *
   * @see https://nextjs.org/docs/messages/no-assign-module-variable
   */
  'nextjs/no-assign-module-variable': 'error',
  /**
   * Disallow async client components.
   *
   * @see https://nextjs.org/docs/messages/no-async-client-component
   */
  'nextjs/no-async-client-component': 'warn',
  /**
   * Restrict beforeInteractive scripts to the document.
   *
   * @see https://nextjs.org/docs/messages/no-before-interactive-script-outside-document
   */
  'nextjs/no-before-interactive-script-outside-document': 'warn',
  /**
   * Disallow manually added stylesheet tags.
   *
   * @see https://nextjs.org/docs/messages/no-css-tags
   */
  'nextjs/no-css-tags': 'warn',
  /**
   * Restrict document imports to the custom document file.
   *
   * @see https://nextjs.org/docs/messages/no-document-import-in-page
   */
  'nextjs/no-document-import-in-page': 'error',
  /**
   * Disallow duplicate Head components.
   *
   * @see https://nextjs.org/docs/messages/no-duplicate-head
   */
  'nextjs/no-duplicate-head': 'error',
  /**
   * Disallow the HTML head element in Next.js pages.
   *
   * @see https://nextjs.org/docs/messages/no-head-element
   */
  'nextjs/no-head-element': 'warn',
  /**
   * Restrict document head imports to the custom document file.
   *
   * @see https://nextjs.org/docs/messages/no-head-import-in-document
   */
  'nextjs/no-head-import-in-document': 'error',
  /**
   * Require Next.js routing instead of HTML links between pages.
   *
   * @see https://nextjs.org/docs/messages/no-html-link-for-pages
   */
  'nextjs/no-html-link-for-pages': 'error',
  /**
   * Prefer `next/image` over HTML image elements.
   *
   * @see https://nextjs.org/docs/messages/no-img-element
   */
  'nextjs/no-img-element': 'warn',
  /**
   * Restrict custom fonts to the custom document file.
   *
   * @see https://nextjs.org/docs/messages/no-page-custom-font
   */
  'nextjs/no-page-custom-font': 'warn',
  /**
   * Disallow Script components in Head.
   *
   * @see https://nextjs.org/docs/messages/no-script-component-in-head
   */
  'nextjs/no-script-component-in-head': 'error',
  /**
   * Restrict styled-jsx to supported files.
   *
   * @see https://nextjs.org/docs/messages/no-styled-jsx-in-document
   */
  'nextjs/no-styled-jsx-in-document': 'warn',
  /**
   * Disallow synchronous script tags.
   *
   * @see https://nextjs.org/docs/messages/no-sync-scripts
   */
  'nextjs/no-sync-scripts': 'error',
  /**
   * Restrict title tags in the custom document head.
   *
   * @see https://nextjs.org/docs/messages/no-title-in-document-head
   */
  'nextjs/no-title-in-document-head': 'warn',
  /**
   * Catch misspelled Next.js data-fetching methods.
   *
   * @see https://nextjs.org/docs/messages/no-typos
   */
  'nextjs/no-typos': 'warn',
  /**
   * Disallow deprecated Polyfill.io URLs.
   *
   * @see https://nextjs.org/docs/messages/no-unwanted-polyfillio
   */
  'nextjs/no-unwanted-polyfillio': 'warn',
} as const;
