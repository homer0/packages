import { DeepAssign } from './deepAssign.js';

/**
 * Makes a deep merge of a list of objects and/or arrays.
 */
export const deepAssign = DeepAssign.fn();
/**
 * Makes a deep merge of a list of objects and/or arrays, while concatenating arrays.
 */
export const deepAssignWithConcat = DeepAssign.fn({ arrayMode: 'concat' });
/**
 * Makes a deep merge of a list of objects and/or arrays, while overwriting existing
 * arrays.
 */
export const deepAssignWithOverwrite = DeepAssign.fn({ arrayMode: 'overwrite' });
/**
 * Makes a deep merge of a list of objects and/or arrays, while replacing items in
 * existing arrays.
 */
export const deepAssignWithShallowMerge = DeepAssign.fn({ arrayMode: 'shallowMerge' });
