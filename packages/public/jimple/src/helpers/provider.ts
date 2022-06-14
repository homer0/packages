import type { Jimple } from '../jimple';
import { resourceFactory } from '../factories';

export type ProviderName = 'provider';
export type ProviderKey = 'register';
export type ProviderRegisterFn<ContainerType extends Jimple = Jimple> = (
  container: ContainerType,
) => void;

export const createProvider = <ContainerType extends Jimple = Jimple>() => {
  type RegisterFn = ProviderRegisterFn<ContainerType>;
  const factory = resourceFactory<RegisterFn>();
  return (register: RegisterFn) => factory('provider', 'register', register);
};

export const provider = createProvider();
export type Provider = ReturnType<typeof provider>;
