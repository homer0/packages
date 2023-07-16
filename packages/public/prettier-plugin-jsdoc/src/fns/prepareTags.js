const R = require('ramda');
const { prepareExampleTag } = require('./prepareExampleTag');
const { prepareTagDescription } = require('./prepareTagDescription');
const { prepareTagName } = require('./prepareTagName');
const { get, provider } = require('./app');
const { composeWithPromise, reduceWithPromise } = require('./utils');

/**
 * @typedef {import('../types').PrettierOptions} PrettierOptions
 * @typedef {import('../types').CommentTag} CommentTag
 */

/**
 * Takes a list of tags and runs them through all the preparations needed for them to be
 * rendered. Preparations include adding the brackes for optional parameters and running
 * Prettier for complex types.
 *
 * @callback PrepareTagsFn
 * @param {CommentTag[]}    tags     The list of tags to format.
 * @param {PrettierOptions} options  The options sent to the plugin, in case they're
 *                                   needed for Prettier.
 * @param {number}          column   The column where the comment will be rendered; this
 *                                   is necessary for some of the functions that may need
 *                                   to call Prettier.
 * @returns {Promise<CommentTag[]>}
 */

/**
 * @type {PrepareTagsFn}
 */
const prepareTags = R.curry(async (tags, options, column) => {
  const fns = [get(prepareTagName)];

  if (options.jsdocFormatExamples) {
    fns.push(get(prepareExampleTag)(R.__, options, column));
  }

  if (options.jsdocEnsureDescriptionsAreSentences) {
    fns.push(get(prepareTagDescription));
  }

  const pipeline = get(composeWithPromise)(...fns.reverse());
  return get(reduceWithPromise)(tags, pipeline);
});

module.exports.prepareTags = prepareTags;
module.exports.provider = provider('prepareTags', module.exports);
