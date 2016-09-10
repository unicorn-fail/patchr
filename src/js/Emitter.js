import Event from './Event';

export default class Emitter {

  /**
   * @class Emitter
   *
   * @constructor
   */
  constructor() {

    /**
     * A list of listeners.
     *
     * @type {Object}
     */
    this.listeners = {};

  }

  /**
   * Emit an event.
   *
   * @param {String} type
   *   A string representing the type of the event to emit. An event type can be
   *   namespaced using dot notation, e.g.:
   *   - a.b.c (invoked first)
   *   - a.b   (invoked second)
   *   - a     (invoked last)
   * @param {...*} [args]
   *   Any additional arguments to pass to the listener. The "this" object for
   *   any bound listener will be the object that originally emitted the event.
   *   In case a listener has bound the callback to a different object, the
   *   object that originally emitted will be appended to the end of the supplied
   *   arguments. See existing objects for examples.
   *
   * @return {Boolean}
   *   True or false. If even one listener returns "false", the entire emitted
   *   event fails and will immediately return. This specifically prevents other
   *   less specific namespaced listeners from being invoked.
   */
  emit(type, ...args) {
    if (!type || typeof type !== 'string') {
      throw new Error(`Invalid event type: ${type}`);
    }

    // Retrieve any listeners. Attempt to use any defined "patchr" property
    // first before attempting to use any defined "listeners" property.
    let listeners = [];

    // Find all potential listeners that match the event type.
    for (let name in this.listeners) {
      if (type.match(new RegExp(name))) {
        listeners = listeners.concat(this.listeners[name]);
      }
    }

    // Go ahead and return true if there are no listeners to invoke.
    if (!listeners.length) {
      return true;
    }

    // Create an event object.
    let event = new Event(type);

    // Set the object that emitted the event.
    event.setTarget(this);

    // Prepend arguments with the event object.
    args.unshift(event);

    // Iterate over the listeners.
    for (let i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }

    // Return whether or not the event was prevented.
    return !event.defaultPrevented;
  }

  /**
   * Removes either a specific listener or all listeners for an event type.
   *
   * @param {String} type
   *   The event type or types, separated by a space.
   * @param {Function} [listener]
   *   The event listener.
   *
   * @chainable
   *
   * @return {*}
   *   The class instance that invoked this method.
   */
  off(type, listener) {
    let types = type.split(' ');
    for (let i = 0, l = types.length; i < l; i++) {
      let type = types[i];

      // Continue if there is no event type.
      if (!this.listeners[type]) {
        continue;
      }

      // Remove all events for a specific type.
      if (!listener) {
        this.listeners[type] = [];
        continue;
      }

      // Remove a specific listener.
      for (let i = 0, l = this.listeners[type].length; i < l; i++) {
        if (this.listeners[type][i] === listener) {
          this.listeners[type].splice(i, 1);
          break;
        }
      }
    }
    return this;
  }

  /**
   * Adds a listener for an event type.
   *
   * @param {String} type
   *   The event type or types, separated by a space.
   * @param {Function} listener
   *   The event listener.
   *
   * @chainable
   *
   * @return {*}
   *   The class instance that invoked this method.
   */
  on(type, listener) {
    let types = type.split(' ');
    for (let i = 0, l = types.length; i < l; i++) {
      let type = types[i];
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(listener);
    }
    return this;
  }

  /**
   * Adds a listener for an event type that is only invoked once.
   *
   * @param {String} type
   *   The event type.
   * @param {Function} listener
   *   The event listener.
   *
   * @chainable
   *
   * @return {Patchr}
   *   The Diff instance.
   */
  once(type, listener) {
    let once = function () {
      this.off(type, once);
      listener.apply(this, arguments);
    };
    return this.on(type, once);
  }

}
