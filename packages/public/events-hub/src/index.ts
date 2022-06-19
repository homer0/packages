// eslint-disable-next-line @typescript-eslint/no-explicit-any -- It's a generic function.
type GenericFn = (...args: any[]) => any;
type GenericParams = Parameters<GenericFn>;
type OnceWrapperFn = GenericFn & {
  once: boolean;
};
type OnceWrapper = {
  wrapper: OnceWrapperFn;
  original: GenericFn;
};

export class EventsHub {
  protected events: Record<string, GenericFn[]> = {};
  protected onceWrappers: Record<string, OnceWrapper[]> = {};

  getSubscribers(event: string): (GenericFn | OnceWrapperFn)[] {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    return this.events[event]!;
  }

  on<ListenerFn extends GenericFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): () => void {
    const events = Array.isArray(event) ? event : [event];
    events.forEach((name) => {
      const subscribers = this.getSubscribers(name);
      if (!subscribers.includes(listener)) {
        subscribers.push(listener);
      }
    });

    return () => this.off<ListenerFn>(event, listener);
  }

  once<ListenerFn extends GenericFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): () => void {
    const events = Array.isArray(event) ? event : [event];
    // Try to find an existing wrapper.
    let wrapper = events.reduce<OnceWrapperFn | null>((acc, name) => {
      // A previous iteration found a wrapper, so `continue`.
      if (acc) return acc;

      // A list of wrappers exists for the event, so, let's try an find one for this function.
      const onceWrapper = this.onceWrappers[name];
      if (Array.isArray(onceWrapper)) {
        const existing = onceWrapper.find((item) => item.original === listener);
        if (existing) {
          return existing.wrapper;
        }

        return null;
      }

      // The list didn't even exists, let's at least create it.
      this.onceWrappers[name] = [];
      return null;
    }, null);

    if (!wrapper) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- It's a generic function.
      const newWrapper = (...args: any[]) => listener(...args);
      newWrapper.once = true;
      wrapper = newWrapper;
      events.forEach((name) => {
        this.onceWrappers[name]!.push({
          wrapper: wrapper!,
          original: listener,
        });
      });
    }

    return this.on(event, wrapper);
  }

  off<ListenerFn extends GenericFn | OnceWrapperFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): boolean | boolean[] {
    const isArray = Array.isArray(event);
    const events = isArray ? event : [event];
    const result = events.map((name) => {
      const subscribers = this.getSubscribers(name);
      const onceSubscribers = this.onceWrappers[name];
      let found = false;
      let index = subscribers.indexOf(listener);
      if (index > -1) {
        found = true;
        /**
         * If the listener had the `once` flag, then it's a wrapper, so it needs to remove
         * it from the wrappers list too.
         */
        if ('once' in listener && onceSubscribers) {
          const wrapperIndex = onceSubscribers.findIndex(
            (item) => item.wrapper === listener,
          );
          onceSubscribers.splice(wrapperIndex, 1);
        }
        subscribers.splice(index, 1);
      } else if (onceSubscribers) {
        /**
         * If it couldn't found the subscriber, maybe it's because it's the original
         * listener of a wrapper.
         */
        index = onceSubscribers.findIndex((item) => item.original === listener);
        if (index > -1) {
          found = true;
          const originalIndex = subscribers.indexOf(onceSubscribers[index]!.original);
          subscribers.splice(originalIndex, 1);
          onceSubscribers.splice(index, 1);
        }
      }

      return found;
    });

    return isArray ? result : result[0]!;
  }

  emit<ListenerFn extends GenericFn = GenericFn>(
    event: string | string[],
    ...args: Parameters<ListenerFn>
  ): void {
    const toClean: { event: string; listener: GenericFn }[] = [];
    const events = Array.isArray(event) ? event : [event];
    events.forEach((name) => {
      this.getSubscribers(name).forEach((subscriber) => {
        subscriber(...args);
        if ('once' in subscriber) {
          toClean.push({
            event: name,
            listener: subscriber,
          });
        }
      });
    });

    toClean.forEach((info) => this.off(info.event, info.listener));
  }

  async reduce<Target, ReducerArgs extends GenericParams>(
    event: string | string[],
    target: Target,
    ...args: ReducerArgs
  ): Promise<Target> {
    const events = Array.isArray(event) ? event : [event];
    const toClean: { event: string; listener: GenericFn }[] = [];
    const result = await events.reduce<Promise<Target>>(
      (eventAcc, name) =>
        eventAcc.then((eventCurrent) => {
          const subscribers = this.getSubscribers(name);
          return subscribers.reduce(
            (subAcc, subscriber) =>
              subAcc.then((subCurrent) => {
                let useCurrent;
                if (Array.isArray(subCurrent)) {
                  useCurrent = subCurrent.slice();
                } else if (typeof subCurrent === 'object') {
                  useCurrent = { ...subCurrent };
                } else {
                  useCurrent = subCurrent;
                }

                const nextStep = subscriber(...[useCurrent, ...args]);
                if ('once' in subscriber) {
                  toClean.push({
                    event: name,
                    listener: subscriber,
                  });
                }

                return nextStep;
              }),
            Promise.resolve(eventCurrent),
          );
        }),
      Promise.resolve(target),
    );

    toClean.forEach((info) => this.off(info.event, info.listener));

    return result;
  }
}

export const eventsHub = () => new EventsHub();
