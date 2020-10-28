const R = require('ramda');
const { hasValidProperty } = require('./utils');
const { formatTSTypes } = require('./formatTSTypes');
const { formatStringLiterals } = require('./formatStringLiterals');
const { formatArrays } = require('./formatArrays');
const { formatObjects } = require('./formatObjects');
const { formatTypeAsCode } = require('./formatTypeAsCode');
const { getFn, provider } = require('../app');

/**
 * @typedef {import('../types').PJPTypesOptions} PJPTypesOptions
 * @typedef {import('../types').CommentTag} CommentTag
 */

/**
 * A function generated by {@link getTypeFormatter} in order to run specific transformations
 * based on the `options` that were sent when it was created.
 *
 * @callback TypeFormatter
 * @param {string} type  The type to format.
 * @returns {string}
 */

/**
 * Generates a {@link TypeFormatter} function to modify a type based on the given `options`.
 *
 * @param {PJPTypesOptions} options  The options that tell the function which formatters should
 *                                   be included and which don't.
 * @param {number}          column   The column where the comment will be rendered.
 * @returns {TypeFormatter}
 */
const getTypeFormatter = (options, column) => {
  const fns = [];
  if (options.jsdocUseTypeScriptTypesCasing) {
    fns.push(getFn(formatTSTypes));
  }

  if (options.jsdocFormatComplexTypesWithPrettier) {
    fns.push(getFn(formatTypeAsCode)(R.__, options, column));
  }

  if (options.jsdocFormatStringLiterals) {
    fns.push(getFn(formatStringLiterals)(R.__, options));
  }

  if (options.jsdocUseShortArrays || options.jsdocFormatDotForArraysAndObjects) {
    fns.push(getFn(formatArrays)(R.__, options));
    if (options.jsdocFormatDotForArraysAndObjects) {
      fns.push(getFn(formatObjects)(R.__, options));
    }
  }

  return fns.length ? R.compose(...fns.reverse()) : R.identity;
};

/**
 * This function will take the `type` of a tag, run it through the `formatter` and return the
 * updated `tag`.
 *
 * @callback FormatTagTypeFn
 * @param {TypeFormatter} formatter  The formatter function for the tag.
 * @param {CommentTag}    tag        The tag which type will be formatted.
 * @returns {CommentTag}
 */

/**
 * @type {FormatTagTypeFn}
 */
const formatTagType = R.curry((formatter, tag) => R.compose(
  (type) => ({ ...tag, type }),
  formatter,
  R.prop('type'),
)(tag));

/**
 * Formats the types of a list of tags.
 *
 * @callback FormatTagsTypes
 * @param {CommentTag[]}    tags     The list of tags to format.
 * @param {PJPTypesOptions} options  The customization options for the formatter.
 * @param {number}          column   The column where the comment will be rendered. This is
 *                                   necessary for some transformations that can involve Prettier
 *                                   itself.
 * @returns {CommentTag[]}
 */

/**
 * @type {FormatTagsTypes}
 */
const formatTagsTypes = R.curry((tags, options, column) => R.map(R.when(
  getFn(hasValidProperty)('type'),
  getFn(formatTagType)(getFn(getTypeFormatter)(options, column)),
))(tags));

module.exports.formatTagsTypes = formatTagsTypes;
module.exports.getTypeFormatter = getTypeFormatter;
module.exports.formatTagType = formatTagType;
module.exports.provider = provider('formatTagsTypes', module.exports);
