jest.unmock('../src');

import { EventsHub, eventsHub } from '../src';

describe('EventsHub', () => {
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

  describe('shorthand', () => {
    it('should create a hub with a function', () => {
      // Given/When/Then
      expect(eventsHub()).toBeInstanceOf(EventsHub);
    });
  });
});
