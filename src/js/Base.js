import Emitter from './Emitter';
import _ from './Utility';

export default class Base extends Emitter {

  /**
   * @class Base
   *
   * @param {Object} [options={}]
   *   Options to override defaults.
   */
  constructor(options = {}) {
    super();

    /**
     * The options.
     *
     * @type {Object}
     */
    this.options = _.extend(true, {}, options);
  }

  /**
   * Emit an event.
   *
   * @param {String} type
   *   A string representing the type of the event to emit.
   * @param {...*} [args]
   *   Any additional arguments to pass to the listener.
   *
   * @return {Promise}
   *   A Promise object that will resolve if the emitted event succeeded or
   *   reject if default was prevented.
   */
  emit(type, ...args) {
    return this.promise((resolve, reject) => {
      if (!super.emit(type, ...args)) {
        return reject(this);
      }
      resolve(this);
    });
  }

  /**
   * Retrieves an option.
   *
   * @param {String} name
   *   The option name. It can also be a namespaced (using dot notation) key to
   *   retrieve a deeply nested option value.
   * @param {*} [defaultValue=null]
   *   The default value to return, if no option has been set.
   *
   * @return {*|null}
   *   The option value or `null` if there is no option or it hasn't been set.
   */
  getOption(name, defaultValue = null) {
    let ret = _.getProperty(name, this.options);
    return ret === null ? defaultValue : ret;
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
    let promise = this.getOption('promise');
    return new promise(resolver.bind(this));
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
    let promise = this.getOption('promise');
    return promise.reject(value);
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
    let promise = this.getOption('promise');
    return promise.resolve(value);
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
    // Always replace CRLF and CR characters with LF. This is necessary for
    // the parser to function properly, which assumes that everything is a LF.
    string = string.replace(/\r\n|\r/g, '\n');

    // Remove comments.
    if (force || this.getOption('sanitize.comments')) {
      string = string.replace(/^#[^\n]*\n/gm, '');
    }

    // Encode HTML entities.
    if (force || this.getOption('sanitize.encodeHtmlEntities')) {
      string = _.encodeHtmlEntities(string);
    }

    // Remove SVN new files.
    if (force || this.getOption('sanitize.svnNewFiles')) {
      string = string.replace(/^\?[^\n]*\n/gm, '');
    }

    return string;
  }

  /**
   * Sets an option.
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
    let p = name && name.split('.') || [];
    if (p.length === 1) {
      this.options[p[0]] = value;
      return this;
    }
    try {
      let obj = p.reduce(function (obj, i) {
        return !_.isPlainObject(obj[i]) ? obj : obj[i];
      }, this.options);
      obj[p[p.length - 1]] = value;
    }
    catch (e) {
      // Intentionally left empty.
    }
    return this;
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
    if (!promise) {
      return _.typeCheck(value, constructor);
    }
    return this.promise((resolve, reject) => {
      try {
        _.typeCheck(value, constructor);
        resolve(value);
      }
      catch (e) {
        reject(e);
      }
    });
  }

}
