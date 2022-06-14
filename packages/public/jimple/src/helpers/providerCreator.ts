import { resourceCreatorFactory, type GenericCurriedFn } from '../factories';
import type { ProviderRegisterFn } from './provider';

export type ProviderCreatorFn = GenericCurriedFn<ProviderRegisterFn>;

const providerCreatorFactory = resourceCreatorFactory<ProviderRegisterFn>();
export const providerCreator = <CreatorFn extends ProviderCreatorFn>(
  creator: CreatorFn,
) => providerCreatorFactory('provider', 'register', creator);
