import type { Jimple } from '../jimple';
import { resourceCreatorFactory, type GenericCurriedFn } from '../factories';
import type { ProviderRegisterFn } from './provider';

export const createProviderCreator = <ContainerType extends Jimple = Jimple>() => {
  type RegisterFn = ProviderRegisterFn<ContainerType>;
  type ProviderCreatorFn = GenericCurriedFn<RegisterFn>;
  const factory = resourceCreatorFactory<RegisterFn>();
  return <CreatorFn extends ProviderCreatorFn>(creator: CreatorFn) =>
    factory('provider', 'register', creator);
};

export const providerCreator = createProviderCreator();
export type ProviderCreatorFn = Parameters<typeof providerCreator>[0];
