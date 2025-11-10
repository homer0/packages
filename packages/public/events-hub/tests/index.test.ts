jest.unmock('@src/index.js');

import { EventsHub, eventsHub } from '@src/index.js';

describe('EventsHub', () => {
  describe('basic', () => {
    it('should allow new subscribers for events', () => {
      // Given
      const eventName = 'THE EVENT';
      const argOne = 'one';
      const argTwo = 'two';
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      sut.emit(eventName, argOne, argTwo);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(argOne, argTwo);
    });

    it('should allow multiple new subscribers for events', () => {
      // Given
      const eventName = 'THE EVENT';
      const subscriberOne = jest.fn();
      const subscriberTwo = jest.fn();
      // When
      const sut = new EventsHub();
      const unsubscribeOne = sut.on(eventName, subscriberOne);
      const unsubscribeTwo = sut.on(eventName, subscriberTwo);
      sut.emit(eventName);
      unsubscribeOne();
      unsubscribeTwo();
      // Then
      expect(subscriberOne).toHaveBeenCalledTimes(1);
      expect(subscriberTwo).toHaveBeenCalledTimes(1);
    });

    it('should allow the same subscriber for multiple events at once', () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventNames, subscriber);
      sut.emit(eventNames);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
    });

    it("shouldn't allow the same subscriber multiple times for the same event", () => {
      // Given
      const eventName = 'THE EVENT';
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      const unsubscribeOne = sut.on(eventName, subscriber);
      const unsubscribeTwo = sut.on(eventName, subscriber);
      sut.emit(eventName);
      unsubscribeOne();
      unsubscribeTwo();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("shouldn't call the subscribers once the unsubscribe function was called", () => {
      // Given
      const eventName = 'THE EVENT';
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      sut.emit(eventName);
      unsubscribe();
      sut.emit(eventName);
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should allow a subscriber that once executed get unsubscribed (`once`)', () => {
      // Given
      const eventName = 'THE EVENT';
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      sut.once(eventName, subscriber);
      sut.emit(eventName);
      sut.emit(eventName);
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("shouldn't allow a subscriber to subscribe 'once' more than one time", () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      sut.once(eventOneName, subscriber);
      sut.once(eventNames, subscriber);
      eventNames.forEach((eventName) => sut.emit(eventName));
      eventNames.forEach((eventName) => sut.emit(eventName));
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
    });

    it('should allow a subscriber to get unsubscribed after executed on multiple events', () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      sut.once(eventNames, subscriber);
      sut.emit(eventNames);
      sut.emit(eventNames);
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
    });

    it('should allow a subscriber to get unsubscribed after executed on separated events', () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      sut.once(eventNames, subscriber);
      eventNames.forEach((eventName) => sut.emit(eventName));
      eventNames.forEach((eventName) => sut.emit(eventName));
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
    });

    it("shouldn't unsubscribe a subscriber until it gets executed on all the events", () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const subscriber = jest.fn();
      // When
      const sut = new EventsHub();
      sut.once(eventNames, subscriber);
      sut.emit(eventOneName);
      sut.emit(eventOneName);
      sut.emit(eventOneName);
      sut.emit(eventOneName);
      sut.emit(eventOneName);
      sut.emit(eventOneName);
      sut.emit(eventTwoName);
      sut.emit(eventNames);
      sut.emit(eventTwoName);
      sut.emit(eventTwoName);
      sut.emit(eventTwoName);
      sut.emit(eventOneName);
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
    });

    it('should allow a subscriber to unsubscribe before beign triggered (`once`)', () => {
      // Given
      const eventName = 'THE EVENT';
      const subscriberOne = jest.fn();
      const subscriberTwo = jest.fn();
      let unsubscribeOne = null;
      // When
      const sut = new EventsHub();
      unsubscribeOne = sut.once(eventName, subscriberOne);
      unsubscribeOne();
      sut.once(eventName, subscriberTwo);
      sut.off(eventName, subscriberTwo);
      sut.emit(eventName);
      // Then
      expect(subscriberOne).toHaveBeenCalledTimes(0);
      expect(subscriberTwo).toHaveBeenCalledTimes(0);
    });
  });

  describe('shorthand', () => {
    it('should create a hub with a function', () => {
      // Given/When/Then
      expect(eventsHub()).toBeInstanceOf(EventsHub);
    });
  });

  describe('reduce', () => {
    it('should allow new subscribers for reduced events (number)', async () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => Promise.resolve(toReduce + 1));
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = await sut.reduce(eventName, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toBe(1);
      expect(target).toBe(targetInitialValue);
    });

    it('should allow new subscribers for reduced events (array)', async () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = ['one', 'two'];
      const target = targetInitialValue.slice();
      const newValue = 'three';
      const subscriber = jest.fn((toReduce) => {
        toReduce.push(newValue);
        return Promise.resolve(toReduce);
      });
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = await sut.reduce(eventName, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toEqual([...targetInitialValue, ...[newValue]]);
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow new subscribers for reduced events (object)', async () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = { one: 1, two: 2 };
      const target = { ...targetInitialValue };
      const newValue = { three: 3 };
      const subscriber = jest.fn((toReduce) =>
        Promise.resolve({ ...toReduce, ...newValue }),
      );
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = await sut.reduce(eventName, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ...targetInitialValue, ...newValue });
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow a subscriber to unsubscribe after reducing an event once', async () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => Promise.resolve(toReduce + 1));
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.once(eventName, subscriber);
      let result = await sut.reduce(eventName, target);
      result = await sut.reduce(eventName, result);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toBe(1);
      expect(target).toBe(targetInitialValue);
    });

    it('should allow a subscriber to reduce multiple events (number)', async () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => Promise.resolve(toReduce + 1));
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventNames, subscriber);
      const result = await sut.reduce(eventNames, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toBe(targetInitialValue + eventNames.length);
      expect(target).toBe(targetInitialValue);
    });

    it('should allow a subscriber to reduce multiple events (array)', async () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = ['one', 'two'];
      const target = targetInitialValue.slice();
      let counter = -1;
      const newValues = ['three', 'four'];
      const subscriber = jest.fn((toReduce) => {
        counter++;
        toReduce.push(newValues[counter]);
        return Promise.resolve(toReduce);
      });
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventNames, subscriber);
      const result = await sut.reduce(eventNames, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toEqual([...targetInitialValue, ...newValues]);
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow a subscriber to reduce multiple events (object)', async () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = { one: 1, two: 2 };
      const target = { ...targetInitialValue };
      let counter = -1;
      const newValues = [{ three: 3 }, { four: 4 }];
      const subscriber = jest.fn((toReduce) => {
        counter++;
        return Promise.resolve({ ...toReduce, ...newValues[counter] });
      });
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventNames, subscriber);
      const result = await sut.reduce(eventNames, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toEqual(Object.assign({}, targetInitialValue, ...newValues));
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow a subscriber to unsubscribe after reducing multiple events once', async () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => Promise.resolve(toReduce + 1));
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.once(eventNames, subscriber);
      let result = await sut.reduce(eventNames, target);
      result = await sut.reduce(eventNames, result);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toBe(targetInitialValue + eventNames.length);
      expect(target).toBe(targetInitialValue);
    });

    it('should return the original target of a reduced event if there are no subscribers', async () => {
      // Given
      const eventName = 'THE EVENT';
      const target = 1;
      // When
      const sut = new EventsHub();
      const result = await sut.reduce(eventName, target);
      // Then
      expect(result).toBe(target);
    });

    it('should allow subscribers to receive multiple arguments for reduced events', async () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const argOne = 1;
      const argTwo = 2;
      const subscriber = jest.fn((toReduce, one, two) =>
        Promise.resolve(toReduce + one + two),
      );
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = await sut.reduce(eventName, target, argOne, argTwo);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(targetInitialValue, argOne, argTwo);
      expect(result).toBe(targetInitialValue + argOne + argTwo);
      expect(target).toBe(targetInitialValue);
    });
  });

  describe('reduceSync', () => {
    it('should allow new subscribers for reduced events (number)', () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => toReduce + 1);
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = sut.reduceSync(eventName, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toBe(1);
      expect(target).toBe(targetInitialValue);
    });

    it('should allow new subscribers for reduced events (array)', () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = ['one', 'two'];
      const target = targetInitialValue.slice();
      const newValue = 'three';
      const subscriber = jest.fn((toReduce) => {
        toReduce.push(newValue);
        return toReduce;
      });
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = sut.reduceSync(eventName, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toEqual([...targetInitialValue, ...[newValue]]);
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow new subscribers for reduced events (object)', () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = { one: 1, two: 2 };
      const target = { ...targetInitialValue };
      const newValue = { three: 3 };
      const subscriber = jest.fn((toReduce) => ({ ...toReduce, ...newValue }));
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = sut.reduceSync(eventName, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ...targetInitialValue, ...newValue });
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow a subscriber to unsubscribe after reducing an event once', () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => toReduce + 1);
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.once(eventName, subscriber);
      let result = sut.reduceSync(eventName, target);
      result = sut.reduceSync(eventName, result);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(result).toBe(1);
      expect(target).toBe(targetInitialValue);
    });

    it('should allow a subscriber to reduce multiple events (number)', () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => toReduce + 1);
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventNames, subscriber);
      const result = sut.reduceSync(eventNames, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toBe(targetInitialValue + eventNames.length);
      expect(target).toBe(targetInitialValue);
    });

    it('should allow a subscriber to reduce multiple events (array)', () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = ['one', 'two'];
      const target = targetInitialValue.slice();
      let counter = -1;
      const newValues = ['three', 'four'];
      const subscriber = jest.fn((toReduce) => {
        counter++;
        toReduce.push(newValues[counter]);
        return toReduce;
      });
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventNames, subscriber);
      const result = sut.reduceSync(eventNames, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toEqual([...targetInitialValue, ...newValues]);
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow a subscriber to reduce multiple events (object)', () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = { one: 1, two: 2 };
      const target = { ...targetInitialValue };
      let counter = -1;
      const newValues = [{ three: 3 }, { four: 4 }];
      const subscriber = jest.fn((toReduce) => {
        counter++;
        return { ...toReduce, ...newValues[counter] };
      });
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventNames, subscriber);
      const result = sut.reduceSync(eventNames, target);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toEqual(Object.assign({}, targetInitialValue, ...newValues));
      expect(target).toEqual(targetInitialValue);
    });

    it('should allow a subscriber to unsubscribe after reducing multiple events once', () => {
      // Given
      const eventOneName = 'FIRST EVENT';
      const eventTwoName = 'SECOND EVENT';
      const eventNames = [eventOneName, eventTwoName];
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const subscriber = jest.fn((toReduce) => toReduce + 1);
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.once(eventNames, subscriber);
      let result = sut.reduceSync(eventNames, target);
      result = sut.reduceSync(eventNames, result);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(eventNames.length);
      expect(result).toBe(targetInitialValue + eventNames.length);
      expect(target).toBe(targetInitialValue);
    });

    it('should return the original target of a reduced event if there are no subscribers', () => {
      // Given
      const eventName = 'THE EVENT';
      const target = 1;
      // When
      const result = eventsHub().reduceSync(eventName, target);
      // Then
      expect(result).toBe(target);
    });

    it('should allow subscribers to receive multiple arguments for reduced events', () => {
      // Given
      const eventName = 'THE EVENT';
      const targetInitialValue = 0;
      const target = targetInitialValue;
      const argOne = 1;
      const argTwo = 2;
      const subscriber = jest.fn((toReduce, one, two) => toReduce + one + two);
      // When
      const sut = new EventsHub();
      const unsubscribe = sut.on(eventName, subscriber);
      const result = sut.reduceSync(eventName, target, argOne, argTwo);
      unsubscribe();
      // Then
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(targetInitialValue, argOne, argTwo);
      expect(result).toBe(targetInitialValue + argOne + argTwo);
      expect(target).toBe(targetInitialValue);
    });
  });
});
