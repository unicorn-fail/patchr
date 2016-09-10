import Patchr from './Patchr';
import _ from './Utility';

export default class Proxy {

  /**
   * A helper class that allows other classes to proxy the methods on the
   * Patchr instance rather than on their own objects. This helps ensure,
   * for instance, all event bindings are located in one place.
   *
   * @param {Patchr} patchr
   *   The Patchr instance.
   * @param {Object} [options={}]
   *   The options specific to this proxied instance.
   *
   * @constructor
   */
  constructor(patchr, options = {}) {
    if (!(patchr instanceof Patchr)) {
      throw new Error(`The "patchr" argument must be an instance of Patchr: ${patchr}`);
    }

    /**
     * The Patchr instance.
     *
     * Define this property so that it cannot be overridden or show up in
     * enumerations. It is meant solely for referencing purposes only.
     *
     * @type {Patchr}
     */
    Object.defineProperty(this, 'patchr', {
      value: patchr,
      configurable: true,
      enumerable: false,
      writable: true
    });

    /**
     * The options specific to this proxied instance.
     *
     * @type {Object}
     */
    this.options = options;
  }

  /**
   * Creates a new Promise that ensures all items in the iterable have finished.
   *
   * @param {Promise[]} array
   *   An array of promises.
   *
   * @return {Promise}
   *   A new Promise object.
   *
   * @see Patchr.promise
   */
  all(array) {
    // Don't proxy the entire method since "this" needs to be bound correctly.
    let promise = this.getPatchrOption('promise');
    return promise.all(array);
  }

  /**
   * Creates a promised based task with start and end emitted events.
   *
   * @param {String} name
   *   The name of the task. It will be used as the emitted event and will be
   *   appended with both a "start" and "stop" namespace.
   * @param {Function} callback
   *   The task callback that will be invoked inside the Promise. It's return
   *   value will be used to fulfill the task's promise. Once the task has
   *   ended, the return value of the task will be the object that originally
   *   invoked the task.
   *
   * @return {Promise}
   *   A Promise object.
   */
  doTask(name, callback) {
    // Execute callback inside setImmediate so long sub-tasks don't block.
    return this.emit(`${name}.start`, this)
      .then(() => callback.call(this))
      .then(value => this.emit(`${name}.end`, this).then(() => value));
  }

  /**
   * Call a function for each value in an array and return a Promise.
   *
   * @param {Array} array
   *   The array to iterate over.
   * @param {Function} callback
   *   The callback to perform on each array item.
   *
   * @return {Promise}
   *   A promise object.
   */
  each(array, callback) {
    array = _.isArray(array) ? array : [array];
    return array.reduce((prev, curr, i) => {
      return prev.then(() => {
        return callback(curr, i, array);
      });
    }, this.resolve()).then(() => {
      return this.resolve(array);
    });
  }

  /**
   * Emit an event.
   *
   * @param {String} type
   *   A string representing the type of the event to emit.
   * @param {...*} [args]
   *   Any additional arguments to pass to the listener.
   *
   * @return {Boolean}
   *   True or false.
   */
  emit(type, args) {
    return this.proxy('emit', arguments);
  }

  /**
   * Cleans up any memory references in the object.
   *
   * @param {String} [type='default']
   *   The type of garbage collection.
   *
   * @return {Boolean}
   *   Flag indicating whether an object's properties should be collected.
   */
  garbageCollect(type = 'default') {
    let collect = !!this.getPatchrOption('garbageCollect');
    // if (collect && type === 'render') {
    //   this.patchr = null;
    // }
    return collect;
  }

  /**
   * Retrieves an option specific to the Patchr instance.
   *
   * @param {String} name
   *   The option name. It can also be a namespaced (using dot notation) key to
   *   retrieve a deeply nested option value.
   * @param {*} [defaultValue=null]
   *   The default value to to return, if no option has been set.
   *
   * @return {*|null}
   *   The option value or `null` if there is no option or it hasn't been set.
   */
  getPatchrOption(name, defaultValue = null) {
    return this.proxy('getOption', arguments);
  }

  /**
   * Retrieves an option for this instance.
   *
   * @param {String} name
   *   The option name. It can also be a namespaced (using dot notation) key to
   *   retrieve a deeply nested option value.
   * @param {*} [defaultValue=null]
   *   The default value to to return, if no option has been set.
   *
   * @return {*|null}
   *   The option value or `null` if there is no option or it hasn't been set.
   */
  getOption(name, defaultValue = null) {
    return this.patchr.getOption.apply(this, arguments);
  }

  /**
   * Creates a new Promise that ensures all items in the iterable have finished.
   *
   * @param {Array} array
   *   The array to map.
   * @param {Function} callback
   *   The callback to invoke on each item in the array.
   *
   * @return {Promise}
   *   A new Promise object.
   *
   * @see Patchr.promise
   */
  map(array, callback) {
    // Convert each item in the object to a promise.
    return this.each(array, (value, i) => {
      array[i] = this.resolve(callback.apply(this, [value, i, array]));
    }).then((array) => {
      return this.all(array);
    });
  }

  /**
   * Removes either a specific listener or all listeners for an event type.
   *
   * @param {String} type
   *   The event type.
   * @param {Function} [listener]
   *   The event listener.
   *
   * @chainable
   *
   * @return {*}
   *   The class instance that invoked this method.
   */
  off(type, listener) {
    this.proxy('off', arguments);
    return this;
  }

  /**
   * Adds a listener for an event type.
   *
   * @param {String} type
   *   The event type.
   * @param {Function} listener
   *   The event listener.
   *
   * @chainable
   *
   * @return {*}
   *   The class instance that invoked this method.
   */
  on(type, listener) {
    this.proxy('on', arguments);
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
   * @return {*}
   *   The class instance that invoked this method.
   */
  once(type, listener) {
    this.proxy('once', arguments);
    return this;
  }

  /**
   * Creates a new Promise.
   *
   * @param {Function} resolver
   *   The resolver function for the Promise. It will automatically be bound
   *   to the object that invoked this method.
   *
   * @return {Promise}
   *   A new Promise object.
   *
   * @see Patchr.promise
   */
  promise(resolver) {
    // Don't proxy the entire method since "this" needs to be bound correctly.
    let promise = this.getPatchrOption('promise');
    return new promise(resolver.bind(this));
  }

  /**
   * Proxies a method call to the Patchr instance.
   *
   * @param {String} method
   *   The method name to invoke.
   * @param {Arguments|Array} args
   *   The arguments to pass.
   *
   * @return {*}
   *   Returns whatever the proxied method returns.
   */
  proxy(method, args) {
    return this.patchr[method].apply(this.patchr, args);
  }

  /**
   * Creates a new Promise that immediately rejects.
   *
   * @param {*} [value]
   *   The value to reject with.
   *
   * @return {Promise}
   *   A rejected Promise object.
   */
  reject(value) {
    return this.proxy('reject', arguments);
  }

  /**
   * Creates a new Promise that immediately resolves.
   *
   * @param {*} [value]
   *   The value to resolve.
   *
   * @return {Promise}
   *   A resolved Promise object.
   */
  resolve(value) {
    return this.proxy('resolve', arguments);
  }

  /**
   * Sanitizes a string.
   *
   * @param {String} string
   *   The string to sanitize.
   * @param {Boolean} [force=false]
   *   Bypasses option and forces sanitization.
   *
   * @return {String}
   *   The sanitized string.
   */
  sanitize(string, force = false) {
    return this.proxy('sanitize', arguments);
  }

  /**
   * Sets an option specific to the Patchr instance.
   *
   * @param {String} name
   *   The option name. It can also be a namespaced (using dot notation) key to
   *   retrieve a deeply nested option value.
   * @param {*} [value=null]
   *   The value to set, if no option has been set.
   *
   * @chainable
   *
   * @return {*}
   *   The class instance that invoked this method.
   */
  setPatchrOption(name, value = null) {
    return this.proxy('setOption', arguments);
  }

  /**
   * Sets an option for this instance.
   *
   * @param {String} name
   *   The option name. It can also be a namespaced (using dot notation) key to
   *   retrieve a deeply nested option value.
   * @param {*} [value=null]
   *   The value to set, if no option has been set.
   *
   * @chainable
   *
   * @return {*}
   *   The class instance that invoked this method.
   */
  setOption(name, value = null) {
    return this.patchr.setOption.apply(this, arguments);
  }

  /**
   * Generates a translated locale string for a given locale key.
   *
   * @param {String} text
   *   The text to translate.
   * @param {String} [langCode]
   *   Overrides the currently set langCode option.
   *
   * @return {String}
   *   The translated string.
   */
  t(text, langCode = this.langCode) {
    return this.proxy('t', arguments);
  }


  /**
   * Ensures that a value is of a certain instance type.
   *
   * @param {*} value
   *   The value to check.
   * @param {Function} constructor
   *   The constructor function to test against.
   * @param {Boolean} [promise=true]
   *   Whether or not to wrap the type check inside a promise.
   *
   * @return {Promise}
   *   Returns a Promise object, if the parameter is set to true. Otherwise it
   *   will return nothing and only an Error will be thrown, if any.
   *
   * @throws {SyntaxError|ReferenceError|TypeError}
   *   Throws an error if the value does not pass the check.
   */
  typeCheck(value, constructor, promise = true) {
    return this.proxy('typeCheck', arguments);
  }

}
