const R = require('ramda');
const { hasValidProperty, composeWithPromise } = require('./utils');
const { formatTSTypes } = require('./formatTSTypes');
const { formatStringLiterals } = require('./formatStringLiterals');
const { formatArrays } = require('./formatArrays');
const { formatObjects } = require('./formatObjects');
const { formatTypeAsCode } = require('./formatTypeAsCode');
const { get, provider } = require('./app');
const { reduceWithPromise } = require('./utils');

/**
 * @typedef {import('../types').PJPTypesOptions} PJPTypesOptions
 * @typedef {import('../types').CommentTag} CommentTag
 */

/**
 * A function generated by {@link getTypeFormatter} in order to run specific
 * transformations based on the `options` that were sent when it was created.
 *
 * @callback TypeFormatter
 * @param {string} type  The type to format.
 * @returns {string}
 */

/**
 * Generates a {@link TypeFormatter} function to modify a type based on the given
 * `options`.
 *
 * @param {PJPTypesOptions} options  The options that tell the function which formatters
 *                                   should be included and which don't.
 * @param {number}          column   The column where the comment will be rendered.
 * @returns {Promise<TypeFormatter>}
 */
const getTypeFormatter = (options, column) => {
  const fns = [];
  if (options.jsdocUseTypeScriptTypesCasing) {
    fns.push(get(formatTSTypes));
  }

  if (options.jsdocFormatComplexTypesWithPrettier) {
    fns.push(get(formatTypeAsCode)(R.__, options, column));
  }

  if (options.jsdocFormatStringLiterals) {
    fns.push(get(formatStringLiterals)(R.__, options));
  }

  if (options.jsdocUseShortArrays || options.jsdocFormatDotForArraysAndObjects) {
    fns.push(get(formatArrays)(R.__, options));
    if (options.jsdocFormatDotForArraysAndObjects) {
      fns.push(get(formatObjects)(R.__, options));
    }
  }

  return fns.length ? get(composeWithPromise)(...fns.reverse()) : R.identity;
};

/**
 * This function will take the `type` of a tag, run it through the `formatter` and return
 * the updated `tag`.
 *
 * @callback FormatTagTypeFn
 * @param {TypeFormatter} formatter  The formatter function for the tag.
 * @param {CommentTag}    tag        The tag which type will be formatted.
 * @returns {Promise<CommentTag>}
 */

/**
 * @type {FormatTagTypeFn}
 */
const formatTagType = R.curry((formatter, tag) =>
  get(composeWithPromise)((type) => ({ ...tag, type }), formatter, R.prop('type'))(tag),
);

/**
 * Formats the types of a list of tags.
 *
 * @callback FormatTagsTypes
 * @param {CommentTag[]}    tags     The list of tags to format.
 * @param {PJPTypesOptions} options  The customization options for the formatter.
 * @param {number}          column   The column where the comment will be rendered. This
 *                                   is necessary for some transformations that can
 *                                   involve Prettier itself.
 * @returns {Promise<CommentTag[]>}
 */

/**
 * @type {FormatTagsTypes}
 */
const formatTagsTypes = R.curry(async (tags, options, column) => {
  const hasValidPropertyFn = get(hasValidProperty)('type');
  const getTypeFormatterFn = get(getTypeFormatter)(options, column);
  const formatTagTypeFn = get(formatTagType)(getTypeFormatterFn);
  return get(reduceWithPromise)(tags, async (tag) => {
    if (hasValidPropertyFn(tag)) {
      return formatTagTypeFn(tag);
    }

    return tag;
  });
});

module.exports.formatTagsTypes = formatTagsTypes;
module.exports.getTypeFormatter = getTypeFormatter;
module.exports.formatTagType = formatTagType;
module.exports.provider = provider('formatTagsTypes', module.exports);
