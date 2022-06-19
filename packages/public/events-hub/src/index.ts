// eslint-disable-next-line @typescript-eslint/no-explicit-any -- It's a generic function.
type GenericFn = (...args: any[]) => any;
type GenericParams = Parameters<GenericFn>;
type OnceWrapperFn = GenericFn & {
  once: boolean;
};
/**
 * When the service receives a "once subscription", it needs to track the listener so it
 * gets removed after being called once, and to avoid modifying the original function, it
 * creates a wrapper function that has the "once" property set to true. The wrapper and
 * the original function are stored in case `off` is called before the wrapper gets
 * triggered; it will receive the original function, not the wrapper, so the class needs a
 * way to map them together.
 */
type OnceWrapper = {
  /**
   * A simple wrapper for the original listener, with the difference that it has a `once`
   * property set to `true`.
   */
  wrapper: OnceWrapperFn;
  /**
   * The original listener that will be called once.
   */
  original: GenericFn;
};
/**
 * A minimal implementation of an events handler service.
 */
export class EventsHub {
  /**
   * A dictionary of the events and their listeners.
   */
  protected events: Record<string, GenericFn[]> = {};
  /**
   * A dictionary of wrappers that were created for "one time subscriptions". This is
   * used by the {@link EventsHub.off}: if it doesn't find the subscriber as it is, it
   * will look for a wrapper and remove it.
   */
  protected onceWrappers: Record<string, OnceWrapper[]> = {};
  /**
   * Gets all the listeners for a specific event.
   * The list is returned by reference, so it can be modified once obtained.
   *
   * @param event  The name of the event.
   */
  protected getSubscribers(event: string): (GenericFn | OnceWrapperFn)[] {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    return this.events[event]!;
  }
  on<ListenerFn extends GenericFn = GenericFn>(
    event: string,
    listener: ListenerFn,
  ): () => boolean;
  on<ListenerFn extends GenericFn = GenericFn>(
    event: string[],
    listener: ListenerFn,
  ): () => boolean[];
  on<ListenerFn extends GenericFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): () => boolean | boolean[];
  /**
   * Adds a new event listener.
   *
   * @param event     An event name or a list of them.
   * @param listener  The listener function.
   * @returns An unsubscribe function to remove the listene(s).
   * @template ListenerFn  The type of the listener function.
   * @example
   *
   *   const events = new EventsHub();
   *   type Listener = (arg0: string) => void;
   *   const unsubscribe = events.on<Listener>('event', (arg0) => {
   *     console.log(`Event received: ${arg0}`);
   *   });
   *
   */
  on<ListenerFn extends GenericFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): () => boolean | boolean[] {
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
    event: string,
    listener: ListenerFn,
  ): () => boolean;
  once<ListenerFn extends GenericFn = GenericFn>(
    event: string[],
    listener: ListenerFn,
  ): () => boolean[];
  once<ListenerFn extends GenericFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): () => boolean | boolean[];
  /**
   * Adds an event listener that will only be executed once.
   *
   * @param event     An event name or a list of them.
   * @param listener  The listener function.
   * @returns An unsubscribe function to remove the listener(s).
   * @template ListenerFn  The type of the listener function.
   * @example
   *
   *   const events = new EventsHub();
   *   type Listener = (arg0: string) => void;
   *   const unsubscribe = events.once<Listener>('event', (arg0) => {
   *     console.log(`Event received: ${arg0}`);
   *   });
   *
   */
  once<ListenerFn extends GenericFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): () => boolean | boolean[] {
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
    event: string[],
    listener: ListenerFn,
  ): boolean[];
  off<ListenerFn extends GenericFn | OnceWrapperFn = GenericFn>(
    event: string,
    listener: ListenerFn,
  ): boolean;
  off<ListenerFn extends GenericFn | OnceWrapperFn = GenericFn>(
    event: string | string[],
    listener: ListenerFn,
  ): boolean | boolean[];
  /**
   * Removes an event listener.
   *
   * @param event     An event name or a list of them.
   * @param listener  The listener function.
   * @returns If `event` was a `string`, it will return whether or not the listener was
   *          found and removed; but if `event`
   *          was an `Array`, it will return a list of boolean values.
   * @template ListenerFn  The type of the listener function.
   * @example
   *
   *   const events = new EventsHub();
   *   const listener = (arg0) => {
   *     console.log(`Event received: ${arg0}`);
   *   };
   *   events.on('event', listener); // subscribe.
   *   events.off('event', listener); // manually unsubscribe.
   *
   */
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
  /**
   * Emits an event and call all its listeners.
   *
   * @param event  An event name or a list of them.
   * @param args   A list of parameters to send to the listeners.
   * @template Args  The type of the parameters to send to the listeners.
   * @example
   *
   *   const events = new EventsHub();
   *   events.on('event', (arg0) => {
   *     console.log(`Event received: ${arg0}`);
   *   });
   *   events.emit('event', 'Hello'); // prints "Event received: Hello"
   *
   */
  emit<Args extends GenericParams>(event: string | string[], ...args: Args): void {
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
  /**
   * Asynchronously reduces a target using an event. It's like emit, but the events
   * listener return a modified (or not) version of the `target`.
   *
   * @param event   An event name or a list of them.
   * @param target  The variable to reduce with the reducers/listeners.
   * @param args    A list of parameters to send to the reducers/listeners.
   * @returns A version of the `target` processed by the listeners.
   * @template Target  The type of the target.
   * @template Args    The type of the parameters to send to the reducers/listeners.
   * @example
   *
   *   const events = new EventsHub();
   *   events.on('event', async (target, arg0) => {
   *     const data = await fetch(`https://api.example.com/${arg0}`);
   *     target.push(data);
   *     return target;
   *   });
   *   const result = await events.reduce('event', [], 'Hello');
   *   // result would be a list of data fetched from the API.
   *
   */
  async reduce<Target, Args extends GenericParams>(
    event: string | string[],
    target: Target,
    ...args: Args
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
  /**
   * Synchronously reduces a target using an event. It's like emit, but the events
   * listener return a modified (or not) version of the `target`.
   *
   * @param event   An event name or a list of them.
   * @param target  The variable to reduce with the reducers/listeners.
   * @param args    A list of parameters to send to the reducers/listeners.
   * @returns A version of the `target` processed by the listeners.
   * @template Target  The type of the target.
   * @template Args    The type of the parameters to send to the reducers/listeners.
   * @example
   *
   *   const events = new EventsHub();
   *   events.on('event', (target, arg0) => {
   *     target.push(arg0);
   *     return target;
   *   });
   *   events.reduce('event', [], 'Hello'); // returns ['Hello']
   *
   */
  reduceSync<Target, ReducerArgs extends GenericParams>(
    event: string | string[],
    target: Target,
    ...args: ReducerArgs
  ): Target {
    const events = Array.isArray(event) ? event : [event];
    const toClean: { event: string; listener: GenericFn }[] = [];
    const result = events.reduce((eventAcc, name) => {
      const subscribers = this.getSubscribers(name);
      return subscribers.reduce((subAcc, subscriber) => {
        let useCurrent;
        if (Array.isArray(subAcc)) {
          useCurrent = subAcc.slice();
        } else if (typeof subAcc === 'object') {
          useCurrent = { ...subAcc };
        } else {
          useCurrent = subAcc;
        }

        const nextStep = subscriber(...[useCurrent, ...args]);
        if ('once' in subscriber) {
          toClean.push({
            event: name,
            listener: subscriber,
          });
        }

        return nextStep;
      }, eventAcc);
    }, target);

    toClean.forEach((info) => this.off(info.event, info.listener));
    return result;
  }
}
/**
 * Shorthand for `new EventsHub()`.
 *
 * @returns A new instance of {@link EventsHub}.
 */
export const eventsHub = () => new EventsHub();
