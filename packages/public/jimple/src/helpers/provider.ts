import { resourceFactory } from '../factories/index.js';
import type { Jimple } from '../jimple/index.js';

export type ProviderName = 'provider';
export type ProviderKey = 'register';
/**
 * The function the container will call when the provider is registered.
 *
 * @template ContainerType The type of the Jimple container (in case it gets subclassed).
 * @param container A reference for container where the provider is being registered.
 */
export type ProviderRegisterFn<ContainerType extends Jimple = Jimple> = (
  container: ContainerType,
) => void;
/**
 * Generates a function to create providers for a specific type of container.
 *
 * @template ContainerType The type of the Jimple container (in case it gets subclassed).
 * @returns A function to create providers.
 */
export const createProvider = <ContainerType extends Jimple = Jimple>() => {
  type RegisterFn = ProviderRegisterFn<ContainerType>;
  const factory = resourceFactory<RegisterFn>();
  return (register: RegisterFn) => factory('provider', 'register', register);
};
/**
 * Creates a resource to be registered in a Jimple container.
 *
 * @example
 *   export const myService = provider((c) => {
 *     c.set('myService', () => new MyService());
 *   });
 */
export const provider = createProvider();
/** A resource that can be registered in a Jimple container. */
export type Provider = ReturnType<typeof provider>;
