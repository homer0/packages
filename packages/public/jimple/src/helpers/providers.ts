import { resourcesCollectionFactory } from '../factories';
import type { ProviderRegisterFn, ProviderName } from './provider';

const collectionFactory = resourcesCollectionFactory<ProviderName, ProviderRegisterFn>();
export const providers = collectionFactory('providers', 'register');
