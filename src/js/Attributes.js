import _ from './Utility';

export default class Attributes {

  /**
   * @class Attributes
   *
   * @param {Attributes|Object} [attributes]
   *   An Attributes object with existing data or a plain object where the key
   *   is the attribute name and the value is the attribute value.
   *
   * @constructor
   */
  constructor(attributes = {}) {

    /*! Attributes (http://cgit.drupalcode.org/bootstrap/tree/js/attributes.js) * Copyright (c) 2016 Mark Carver <https://www.drupal.org/u/markcarver> * Licensed under GPL-2.0 (https://www.drupal.org/about/licensing) */ // eslint-disable-line

    /**
     * The internal object containing the data for the attributes.
     *
     * @type {Object}
     */
    this.data = {};
    this.data['class'] = [];

    this.merge(attributes);
  }

  /**
   * Renders the attributes object as a string to inject into an HTML element.
   *
   * @return {String}
   *   A string representation of the attributes array, intended to be injected
   *   into a DOM element.
   */
  toString() {
    let output = '';
    let name;
    let value;
    for (name in this.data) {
      if (!this.data.hasOwnProperty(name)) {
        continue;
      }
      value = this.data[name];
      if (_.isFunction(value)) {
        value = value.call(this);
      }
      if (_.isObject(value)) {
        let values = [];
        for (let i in value) {
          if (value.hasOwnProperty(i)) {
            values.push(value[i]);
          }
        }
        value = values;
      }
      if (_.isArray(value)) {
        value = value.join(' ');
      }
      // Don't add an empty class array.
      if (name === 'class' && !value) {
        continue;
      }
      output += ` ${_.encodeHtmlEntities(name)}="${_.encodeHtmlEntities(value)}"`;
    }
    return output;
  }

  /**
   * Add class(es) to the Attributes object.
   *
   * @param {...String|Array} value
   *   An individual class or an array of classes to add.
   *
   * @return {Attributes}
   *   The Attributes instance.
   *
   * @chainable
   */
  addClass(value) {
    let args = Array.prototype.slice.call(arguments);
    let classes = [];
    for (let i = 0, l = args.length; i < l; i++) {
      classes = classes.concat(_.sanitizeClasses(args[i]));
    }
    this.data['class'] = _.arrayUniq(this.data['class'].concat(classes));
    return this;
  }

  /**
   * Indicates whether an attribute exists in the Attributes object.
   *
   * @param {String} name
   *   An attribute name to check.
   *
   * @return {Boolean}
   *   True or false.
   */
  exists(name) {
    return !_.isUndefined(this.data[name]) && this.data[name] !== null;
  }

  /**
   * Retrieve a specific attribute from the Attributes object.
   *
   * @param {String} name
   *   The specific attribute to retrieve.
   * @param {*} [defaultValue=null]
   *   (optional) The default value to set if the attribute does not exist.
   *
   * @return {*}
   *   A specific attribute value, passed by reference.
   */
  get(name, defaultValue) {
    if (!this.exists(name)) {
      this.data[name] = !_.isUndefined(defaultValue) ? defaultValue : null;
    }
    return this.data[name];
  }

  /**
   * Retrieves a cloned copy of the internal attributes data object.
   *
   * @return {Object}
   *   The cloned copy of the attribute data.
   */
  getData() {
    return _.extend({}, this.data);
  }

  /**
   * Retrieves classes from the Attributes object.
   *
   * @return {Array}
   *   The classes array.
   */
  getClasses() {
    return this.get('class', []);
  }

  /**
   * Indicates whether a class is present in the Attributes object.
   *
   * @param {String|Array} className
   *   The class name(s) to search for.
   *
   * @return {Boolean}
   *   True or false.
   */
  hasClass(className) {
    className = _.sanitizeClasses(className);
    let classes = this.getClasses();
    for (let i = 0, l = className.length; i < l; i++) {
      // If one of the classes fails, immediately return false.
      if (_.indexOf(classes, className[i]) === -1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Merges multiple values into the Attributes object.
   *
   * @param {Attributes|Object|String} attributes
   *   An Attributes object with existing data or a plain object where the key
   *   is the attribute name and the value is the attribute value.
   * @param {Boolean} [recursive]
   *   Flag determining whether or not to recursively merge key/value pairs.
   *
   * @return {Attributes}
   *   The Attributes instance.
   *
   * @chainable
   */
  merge(attributes, recursive) {
    attributes = attributes instanceof Attributes ? attributes.getData() : attributes;

    // Ensure any passed are sanitized.
    if (attributes && !_.isUndefined(attributes['class'])) {
      attributes['class'] = _.sanitizeClasses(attributes['class']);
    }

    if (_.isUndefined(recursive) || recursive) {
      this.data = _.extend(true, {}, this.data, attributes);
    }
    else {
      this.data = _.extend({}, this.data, attributes);
    }

    // Ensure classes are unique after merge.
    this.data['class'] = _.arrayUniq(this.data['class']);

    return this;
  }

  /**
   * Removes an attribute from the Attributes object.
   *
   * @param {String} name
   *   The name of the attribute to remove.
   *
   * @return {Attributes}
   *   The Attributes instance.
   *
   * @chainable
   */
  remove(name) {
    if (this.exists(name)) {
      delete this.data[name];
    }
    return this;
  }

  /**
   * Removes a class from the Attributes object.
   *
   * @param {...String|Array} value
   *   An individual class or an array of classes to remove.
   *
   * @return {Attributes}
   *   The Attributes instance.
   *
   * @chainable
   */
  removeClass(value) {
    let args = Array.prototype.slice.apply(arguments);
    let classes = this.getClasses();
    let values = [];
    for (let i = 0, l = args.length; i < l; i++) {
      values = values.concat(_.sanitizeClasses(args[i]));
      for (let ii = 0, ll = values.length; ii < ll; ii++) {
        let index = _.indexOf(classes, values[ii]);
        if (index !== -1) {
          classes.slice(index, 1);
        }
      }
    }
    return this;
  }

  /**
   * Replaces a class in the Attributes object.
   *
   * @param {String} oldValue
   *   The old class to remove.
   * @param {String} newValue
   *   The new class. It will not be added if the old class does not exist.
   *
   * @return {Attributes}
   *   The Attributes instance.
   *
   * @chainable
   */
  replaceClass(oldValue, newValue) {
    let classes = this.getClasses();
    let i = _.indexOf(classes, oldValue);
    if (i !== -1) {
      classes[i] = newValue;
    }
    return this;
  }

  /**
   * Sets an attribute on the Attributes object.
   *
   * @param {String} name
   *   The name of the attribute to set.
   * @param {*} value
   *   The value of the attribute to set.
   *
   * @return {Attributes}
   *   The Attributes instance.
   *
   * @chainable
   */
  set(name, value) {
    this.data[name] = name === 'class' ? _.sanitizeClasses(value) : value;
    return this;
  }

}
