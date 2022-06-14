import type { Jimple } from '../jimple';
import { resourceFactory, type Resource } from '../factories';

export type ProviderName = 'provider';
export type ProviderKey = 'register';
export type ProviderRegisterFn = (container: Jimple) => void;
export type Provider = Resource<ProviderName, ProviderKey, ProviderRegisterFn>;

const providerFactory = resourceFactory<ProviderRegisterFn>();
export const provider = (register: ProviderRegisterFn): Provider =>
  providerFactory('provider', 'register', register);
