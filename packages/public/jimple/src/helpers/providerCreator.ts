import type { Jimple } from '../jimple/index.js';
import { resourceCreatorFactory, type GenericCurriedFn } from '../factories/index.js';
import type { ProviderRegisterFn } from './provider.js';
/**
 * Generates a function to create "provider creators" for a specific type of container.
 *
 * @returns A function to generate provider creators.
 * @template ContainerType  The type of the Jimple container (in case it gets
 *                          subclassed).
 */
export const createProviderCreator = <ContainerType extends Jimple = Jimple>() => {
  type RegisterFn = ProviderRegisterFn<ContainerType>;
  type ProviderCreatorFn = GenericCurriedFn<RegisterFn>;
  const factory = resourceCreatorFactory<RegisterFn>();
  return <CreatorFn extends ProviderCreatorFn>(creator: CreatorFn) =>
    factory('provider', 'register', creator);
};
/**
 * Generates a "provider creator": a provider that can also be called as a function in
 * order to create a configured provider.
 *
 * @example
 *
 *   export const myService = providerCreator((options: Opts = {}) => (c) => {
 *     c.set('myService', () => new MyService(options));
 *   });
 *
 */
export const providerCreator = createProviderCreator();
/**
 * A function that returns a provider registration function.
 */
export type ProviderCreatorFn = Parameters<typeof providerCreator>[0];
