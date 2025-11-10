import type { Jimple } from '../jimple/index.js';
import { resourcesCollectionFactory } from '../factories/index.js';
import type { ProviderRegisterFn, ProviderName } from './provider.js';
/**
 * Generates a function to create a providers collection for a specific type of container.
 *
 * @returns A function to create providers collections.
 * @template ContainerType  The type of the Jimple container (in case it gets
 *                          subclassed).
 */
export const createProviders = <ContainerType extends Jimple = Jimple>() => {
  type RegisterFn = ProviderRegisterFn<ContainerType>;
  const factory = resourcesCollectionFactory<ProviderName, RegisterFn>();
  return factory('provider', 'register');
};
/**
 * Generates a collection of providers. A collection is a dictionary of providers that can
 * also be used as a provider, and when it gets registered, it will register all of the
 * providers in the collection.
 *
 * @param items  A dictionary of providers.
 * @example
 *
 * <caption>Assuming we already have two service providers...</caption>
 *
 *   export const services = providers({
 *     myServiceProvider,
 *     myOtherServiceProvider,
 *   });
 *
 */
export const providers = createProviders();
