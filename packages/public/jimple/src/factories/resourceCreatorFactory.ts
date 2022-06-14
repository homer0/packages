import { resourceFactory } from './resourceFactory';
import type {
  GenericFn,
  GenericCurriedFn,
  ResourceCreator,
  ResourceCreatorCurriedFn,
  ResourceCreatorHandler,
} from './factories.types';

export const resourceCreatorFactory =
  <ResourceFn extends GenericFn>() =>
  <
    ResName extends string,
    ResKey extends string,
    ResFn extends ResourceFn,
    CreatorFn extends GenericCurriedFn<ResFn>,
  >(
    name: ResName,
    key: ResKey,
    creatorFn: CreatorFn,
  ): ResourceCreator<ResName, ResKey, CreatorFn> => {
    const fnToProxy: ResourceCreatorCurriedFn<ResName, ResKey, CreatorFn> = (...args) => {
      const actualResource = creatorFn(...args) as ReturnType<CreatorFn>;
      return resourceFactory<ResFn>()(name, key, actualResource);
    };

    const handler: ResourceCreatorHandler<ResName, ResKey, CreatorFn> = {
      name,
      resource: null,
      get(target, property) {
        let result;
        if (property === this.name) {
          result = true;
        } else if (property === key) {
          if (this.resource === null) {
            const newResource = creatorFn() as ReturnType<CreatorFn>;
            this.resource = newResource;
          }
          result = this.resource;
        } else {
          const targetKey = property as keyof typeof target;
          result = target[targetKey];
        }

        return result;
      },
    };

    return new Proxy(fnToProxy, handler) as unknown as ResourceCreator<
      ResName,
      ResKey,
      CreatorFn
    >;
  };
