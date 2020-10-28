const R = require('ramda');
const {
  TAGS_WITH_DESCRIPTION_AS_NAME,
  TAGS_WITH_NAME_AS_DESCRIPTION,
} = require('../constants');
const { isTag, hasValidProperty } = require('./utils');
const { getFn, provider } = require('../app');

/**
 * @typedef {import('../types').CommentTag} CommentTag
 */

/**
 * Checks if a tag description starts with a new line or not in order to add the
 * `descriptionParagrah` flag property.
 *
 * @param {CommentTag} tag The tag where the flag will be added.
 * @returns {CommentTag}
 */
const addParagraphFlag = (tag) => ({
  ...tag,
  descriptionParagrah: tag.description.startsWith('\n'),
});

/**
 * Utility function that fixes texts from properties that were splitted incorrectly. For example,
 * the parser would take the text from a `description` text, set the first word as the tag `name`
 * and the rest as `description`.
 *
 * @callback JoinPropertiesFn
 * @param {string}     propA  The property that starts the text.
 * @param {string}     propB  The property that ends the text.
 * @param {string}     prop   The property where the text will be placed. This needs to be the
 *                            value of either `propA` or `propB`, and whichever you don't choose
 *                            will be left as an empty string.
 * @param {CommentTag} tag    The tag to format.
 * @returns {CommentTag}
 */

/**
 * @type {JoinPropertiesFn}
 */
const joinProperties = R.curry((propA, propB, prop, tag) => {
  const cleanProp = prop === propA ? propB : propA;
  const valA = tag[propA];
  const valB = tag[propB];
  let newVal;
  if (valA.length && valB.length) {
    newVal = `${tag[propA]} ${tag[propB]}`;
  } else if (valB.length) {
    newVal = valB;
  } else {
    newVal = valA;
  }
  return {
    ...tag,
    [prop]: newVal,
    [cleanProp]: '',
  };
});

/**
 * Takes a tag that has a link tag as a type and moves it to the property where the description
 * starts.
 *
 * @param {CommentTag} tag The tag to fix.
 * @returns {CommentTag}
 */
const addLinkToDescription = (tag) => ({
  ...tag,
  type: '',
  name: `{${tag.type}} ${tag.name}`.trimRight(),
});

/**
 * Formats the descriptions of a list of tags in order to fix those texts the parser may have
 * incorrectly splitted (like the tag description that ends on `name` and `description`), moves
 * `link` tags mistaken as types to the description, and  then it adds the `descriptionParagrah`
 * flag to the tags.
 *
 * @param {CommentTag[]} tags  The list of tags to format.
 * @returns {CommentTag[]}
 */
const formatTagsDescription = (tags) => {
  const useIsTag = getFn(isTag);
  const useJoinProperties = getFn(joinProperties);
  return R.map(
    R.compose(
      addParagraphFlag,
      R.when(
        useIsTag(TAGS_WITH_NAME_AS_DESCRIPTION),
        useJoinProperties('name', 'description', 'name'),
      ),
      R.when(
        useIsTag(TAGS_WITH_DESCRIPTION_AS_NAME),
        useJoinProperties('name', 'description', 'description'),
      ),
      R.when(
        R.allPass([
          getFn(hasValidProperty)('type'),
          R.propSatisfies(R.startsWith('@link'), 'type'),
        ]),
        getFn(addLinkToDescription),
      ),
    ),
    tags,
  );
};

module.exports.formatTagsDescription = formatTagsDescription;
module.exports.joinProperties = joinProperties;
module.exports.addLinkToDescription = addLinkToDescription;
module.exports.provider = provider('formatTagsDescription', module.exports);