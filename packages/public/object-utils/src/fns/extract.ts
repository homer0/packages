import { get } from './get';
import { set } from './set';
import { copy } from './copy';
/**
 * Used in the {@link extract} function to specify a path for a property, or an "origin path"
 * and an "extraction path".
 */
export type extractionPath = string | Record<string, string>;

export type ExtractOptions = {
  /**
   * The object from where the property/properties will be extracted.
   */
  target: unknown;
  /**
   * This can be a single path or a list of them. And for this method, the paths are not
   * only strings but can also be an object with a single key, that would be the path to
   * where to "do the extraction", and the value the path on the target object.
   */
  paths: extractionPath | extractionPath[];
  /**
   * The delimiter that will separate the path components.
   */
  pathDelimiter?: string;
  /**
   * Whether or not to throw an error when the path is invalid. If this is `false`, the
   * method will silently fail an empty object.
   */
  failWithError?: boolean;
};
/**
 * Extracts a property or properties from an object in order to create a new one.
 *
 * @param options  The options to use.
 * @template T  The type of the returned object.
 * @example
 *
 *   const target = {
 *     name: {
 *       first: 'Pilar',
 *     },
 *     age: 3,
 *     address: {
 *       planet: 'earth',
 *       something: 'else',
 *     },
 *   };
 *   console.log(
 *     extract({
 *       target: obj,
 *       paths: [{ name: 'name.first' }, 'age', 'address.planet'],
 *     }),
 *   );
 *   // Will output { name: 'Pilar', age: 3, address: { planet: 'earth' } }
 *
 */
export const extract = <T = Record<string, unknown>>(
  options: ExtractOptions,
): T | undefined => {
  const { target, paths, pathDelimiter = '.', failWithError = false } = options;
  const copied = copy(target) as Record<string, unknown>;
  let result: Record<string, unknown> = {};
  let failed = false;
  (Array.isArray(paths) ? paths : [paths])
    .reduce<Array<{ origin: string; customDest: boolean; dest: string }>>(
      (acc, objPath) => {
        let destPath: string;
        let originPath: string;
        if (typeof objPath === 'string') {
          destPath = objPath;
          originPath = objPath;
        } else {
          const [firstKey] = Object.keys(objPath);
          destPath = firstKey!;
          originPath = objPath[destPath]!;
        }

        acc.push({
          origin: originPath,
          customDest: destPath.includes(pathDelimiter),
          dest: destPath,
        });
        return acc;
      },
      [],
    )
    .some((pathInfo) => {
      let breakLoop = false;
      const value = get({
        target: copied,
        path: pathInfo.origin,
        pathDelimiter,
        failWithError,
      });
      if (typeof value !== 'undefined') {
        if (pathInfo.customDest) {
          const withCustomProp = set({
            target: result,
            path: pathInfo.dest,
            value,
            pathDelimiter,
            failWithError,
          });
          if (typeof withCustomProp === 'undefined') {
            breakLoop = true;
            failed = true;
          } else {
            result = withCustomProp;
          }
        } else {
          result[pathInfo.dest] = value;
        }
      }

      return breakLoop;
    });

  if (failed) return undefined;
  return result as T;
};
