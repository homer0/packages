import type { Jimple } from '../jimple';
import { resourcesCollectionFactory } from '../factories';
import type { ProviderRegisterFn, ProviderName } from './provider';

export const createProviders = <ContainerType extends Jimple = Jimple>() => {
  type RegisterFn = ProviderRegisterFn<ContainerType>;
  const factory = resourcesCollectionFactory<ProviderName, RegisterFn>();
  return factory('provider', 'register');
};

export const providers = createProviders();
