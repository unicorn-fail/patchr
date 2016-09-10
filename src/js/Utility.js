import arrayUniq from 'array-uniq';
import Element from './Element';
import {deparam, param} from 'node-qs-serialization';
import extend from 'extend';
import HTML from 'html-parse-stringify2';
import indexOf from 'indexof';
import isFunction from 'is-function';
import isObject from 'isobject';
import isPlainObject from 'is-plain-object';
import isUndefined from 'is-undefined';
import urlRegex from 'url-regex';

const Utility = {

  /**
   * Ensures that the values in an array are unique.
   *
   * @param {Array} array
   *   The array to iterate over.
   *
   * @return {Array}
   *   An array with unique values.
   */
  arrayUniq(array) {
    return arrayUniq(array);
  },

  /**
   * Retrieves the basename for a path.
   *
   * @param {String} path
   *   The path to use.
   * @param {String} [suffix]
   *   Optional. The suffix to strip off.
   *
   * @return {String}
   *   The basename of the path, minus any suffix that was passed.
   */
  basename(path, suffix) {
    /*eslint-disable*/
    /*! PHP's basename in JavaScript (https://github.com/kvz/locutus/blob/master/src/php/filesystem/basename.js) * Copyright (c) 2007-2016 Kevin van Zonneveld (http://kvz.io) and Contributors (http://locutus.io/authors) * Licensed under MIT (https://github.com/kvz/locutus/blob/master/LICENSE) */
    let b = path;
    let lastChar = b.charAt(b.length - 1);
    if (lastChar === '/' || lastChar === '\\') {
      b = b.slice(0, -1);
    }
    b = b.replace(/^.*[\/\\]/g, '');
    if (typeof suffix === 'string' && b.substr(b.length - suffix.length) === suffix) {
      b = b.substr(0, b.length - suffix.length);
    }
    return b;
    /*eslint-enable*/
  },

  /**
   * Creates a new Element.
   *
   * @param {Element|String} [content]
   *   The content used to create the element. Must be fully enclosed HTML tags.
   *
   * @return {Element|String}
   *   A new Element instance or a string value.
   */
  createElement(content) {
    return Element.create(content);
  },

  /**
   * Parses any query parameters from a URL.
   *
   * @param {String} string
   *   The string to parse.
   *
   * @return {Object}
   *   An object representing the query parameters.
   */
  deparam(string) {
    return deparam(string);
  },

  /**
   * Small helper method to encode html entities.
   *
   * @param {String} string
   *   The string to encode.
   *
   * @return {String}
   *   The encoded string.
   *
   * @todo Possibly replace with real library like html-entities?
   * A little wary of doing so though since many of these libraries
   * add a lot of weight (min 40k).
   */
  encodeHtmlEntities(string) {
    return ('' + string).replace(/[\u00A0-\u9999<>&]/g, function (i) {
      return `&#${i.charCodeAt(0)};`;
    });
  },

  /**
   * Extends an object (similar to jQuery's extend).
   *
   * @param {Boolean} [deep=false]
   *   Whether or not to iterate through any nested objects and merge any
   *   differences at that level.
   * @param {...Object} obj
   *   The objects to extend. The first object passed will be used as the
   *   "target" object. So if you don't want to extend the first object, pass
   *   an empty object. This is essentially the same as "cloning" an object.
   *
   * @return {Object}
   *   The target object (first object passed).
   */
  extend(deep, obj) {
    return extend.apply({}, arguments);
  },

  /**
   * Retrieves a file's extension.
   *
   * @param {String} filename
   *   The filename to extract the extension from.
   *
   * @return {String}
   *   The extension.
   *
   * @see http://stackoverflow.com/a/12900504
   */
  extension(filename) {
    return /tar\.gz$/.test(filename) ? 'tar.gz' : filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  /**
   * Retrieves a property of an object using dot notation.
   *
   * @param {String} name
   *   The property to retrieve, using dot notation.
   * @param {Object} object
   *   The object to search through.
   *
   * @return {*|null}
   *   The property value or null if it isn't set.
   */
  getProperty(name, object) {
    return name.split('.').reduce((a, b) => !isUndefined(a[b]) ? a[b] : null, object);
  },

  /**
   * Retrieves the index of the value in an array.
   *
   * @param {Array} array
   *   The array to search.
   * @param {*} value
   *   The value to search for.
   *
   * @return {Number}
   *   The index position or -1 if the value is not in the array.
   */
  indexOf(array, value) {
    return indexOf(array, value);
  },

  /**
   * Determines if the value passed is an array.
   *
   * @param {*} value
   *   The value to test.
   *
   * @return {Boolean}
   *   True or false.
   */
  isArray(value) {
    return Array.isArray(value);
  },

  /**
   * Determines if the value passed is a function.
   *
   * @param {*} value
   *   The value to test.
   *
   * @return {Boolean}
   *   True or false.
   */
  isFunction(value) {
    return isFunction(value);
  },

  /**
   * Determines if the value passed is an object.
   *
   * @param {*} value
   *   The value to test.
   *
   * @return {Boolean}
   *   True or false.
   */
  isObject(value) {
    return isObject(value);
  },

  /**
   * Determines if the value passed is a "plain" object.
   *
   * @param {*} value
   *   The value to test.
   *
   * @return {Boolean}
   *   True or false.
   */
  isPlainObject(value) {
    return isPlainObject(value);
  },

  /**
   * Determines if a string is a valid SHA1 digest.
   *
   * @param {String} string
   *   The string to test.
   *
   * @return {Boolean}
   *   True or false.
   */
  isSha1(string) {
    return /^[0-9a-f]{5,40}$/.test(string);
  },

  /**
   * Compares a value against a certain constructor.
   *
   * @param {*} value
   *   The value to check.
   * @param {String|Function} constructor
   *   The constructor object to test against. This can be a string value that
   *   will "require" it. If it cannot find the exported module, then it should
   *   be required beforehand and the constructor passed instead.
   *
   * @return {Boolean}
   *   True or false.
   */
  isType(value, constructor) {
    return Utility.typeCheck(value, constructor, false);
  },

  /**
   * Determines if a value is undefined.
   *
   * @param {*} value
   *   The value to check.
   *
   * @return {Boolean}
   *   True or false.
   */
  isUndefined(value) {
    return isUndefined(value);
  },

  /**
   * Determines if a string is a properly constructed URL.
   *
   * @param {String} string
   *   The string to test.
   * @param {Object} [options={exact:true}]
   *   The options to pass along to the url-regex module.
   *
   * @return {Boolean}
   *   Returns `true` if the string is a URL, false otherwise.
   *
   * @see https://www.npmjs.com/package/url-regex
   */
  isUrl(string, options = {exact: true}) {
    // Immediately return false if there is more than one line in the string.
    return string.search(/(\n|\r\n|\r)/gm) !== -1 ? false : urlRegex(options).test(string);
  },

  /**
   * Retrieves a machine name version of a string.
   *
   * @param {String} string
   *   The string to parse.
   *
   * @return {string}
   *   The machine name.
   */
  machineName(string) {
    return string.replace(/([A-Z]+[^A-Z]+)/g, '_$1').toLowerCase().replace(/[^a-z0-9-]+/g, '_').replace(/_+/g, '_').replace(/(^_|_$)/g, '');
  },

  /**
   * An empty function.
   *
   * @type {Function}
   */
  noop() {
  },

  /**
   * Retrieves a normalized object for a given pre-computed dimension.
   *
   * @param {'border'|'margin'|'padding'} dimension
   *   The dimension to retrieve.
   * @param {Object|Number} value
   *   The value to normalize.
   *
   * @return {{bottom: Number, left: Number, right: Number, top: Number}}
   *   The normalized dimension object.
   */
  normalizeDimension(dimension, value) {
    let allowed = ['border', 'margin', 'padding'];
    if (indexOf(allowed, dimension) === -1) {
      throw new TypeError(`Unknown dimension: ${dimension}. Only the following dimensions are allowed: ${allowed.join(', ')}`);
    }
    let defaultValues = (value = 0) => {
      return {
        bottom: value,
        left: value,
        right: value,
        top: value
      };
    };
    if (typeof value === 'number') {
      value = defaultValues(value);
    }
    else if (isPlainObject(value)) {
      value = extend({}, defaultValues(), value);
    }
    else {
      throw new TypeError(`The "${dimension}" dimension provided must be a Number or a plain object.`);
    }
    return value;
  },

  /**
   * Serializes an object into query parameters.
   *
   * @param {Array|Object} object
   *   The array or object to serialize.
   *
   * @return {String}
   *   A query string of serialized parameters.
   */
  param(object) {
    return param(object);
  },

  /**
   * Parses a string into an HTML AST object.
   *
   * @param {String} html
   *   The HTML string to parse.
   * @param {Object} [options={ignoreWhitespace: false}]
   *   An object of options to pass along to the parser.
   *
   * @return {Object}
   *   An AST object representation of the HTML passed.
   */
  parseHtml(html, options = {ignoreWhitespace: false}) {
    return HTML.parse(html, options);
  },

  /**
   * Ensures classes is an array and/or split into individual array items.
   *
   * @param {...String|Array} classes
   *   The class or classes to sanitize.
   *
   * @return {Array}
   *   A sanitized array of classes.
   */
  sanitizeClasses(...classes) {
    let sanitized = [];
    for (let i = 0, l = classes.length; i < l; i++) {
      let values = classes[i] instanceof Array && classes[i] || typeof classes[i] === 'string' && classes[i].split(' ') || [];
      if (values.length) {
        for (let i = 0, l = values.length; i < l; i++) {
          sanitized.push(values[i]);
        }
      }
    }
    return arrayUniq(sanitized);
  },

  /**
   * Generates an SHA1 digest for a string.
   *
   * @param {String} str
   *   The string to use.
   *
   * @return {String}
   *   The SHA1 digest.
   */
  sha1(str) {
    /*eslint-disable*/
    /*! PHP's sha1 in JavaScript (https://github.com/kvz/locutus/blob/master/src/php/strings/sha1.js) * Copyright (c) 2007-2016 Kevin van Zonneveld (http://kvz.io) and Contributors (http://locutus.io/authors) Licensed under MIT (https://github.com/kvz/locutus/blob/master/LICENSE) */
    let _rotLeft = function (n, s) {
      let t4 = (n << s) | (n >>> (32 - s));
      return t4;
    };
    let _cvtHex = function (val) {
      let str = '', i, v;
      for (i = 7; i >= 0; i--) {
        v = (val >>> (i * 4)) & 0x0f;
        str += v.toString(16);
      }
      return str;
    };
    let blockstart, i, j, A, B, C, D, E, temp;
    let W = new Array(80), H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;
    str = unescape(encodeURIComponent(str));
    let strLen = str.length;
    let wordArray = [];
    for (i = 0; i < strLen - 3; i += 4) {
      j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3);
      wordArray.push(j);
    }
    switch (strLen % 4) {
      case 0:
        i = 0x080000000;
        break;
      case 1:
        i = str.charCodeAt(strLen - 1) << 24 | 0x0800000;
        break;
      case 2:
        i = str.charCodeAt(strLen - 2) << 24 | str.charCodeAt(strLen - 1) << 16 | 0x08000;
        break;
      case 3:
        i = str.charCodeAt(strLen - 3) << 24 | str.charCodeAt(strLen - 2) << 16 | str.charCodeAt(strLen - 1) << 8 | 0x80;
        break;
    }
    wordArray.push(i);
    while ((wordArray.length % 16) !== 14) {
      wordArray.push(0);
    }
    wordArray.push(strLen >>> 29);
    wordArray.push((strLen << 3) & 0x0ffffffff);
    for (blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
      for (i = 0; i < 16; i++) {
        W[i] = wordArray[blockstart + i]
      }
      for (i = 16; i <= 79; i++) {
        W[i] = _rotLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1)
      }
      A = H0;
      B = H1;
      C = H2;
      D = H3;
      E = H4;
      for (i = 0; i <= 19; i++) {
        temp = (_rotLeft(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      for (i = 20; i <= 39; i++) {
        temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      for (i = 40; i <= 59; i++) {
        temp = (_rotLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      for (i = 60; i <= 79; i++) {
        temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      H0 = (H0 + A) & 0x0ffffffff;
      H1 = (H1 + B) & 0x0ffffffff;
      H2 = (H2 + C) & 0x0ffffffff;
      H3 = (H3 + D) & 0x0ffffffff;
      H4 = (H4 + E) & 0x0ffffffff;
    }
    temp = _cvtHex(H0) + _cvtHex(H1) + _cvtHex(H2) + _cvtHex(H3) + _cvtHex(H4);
    return temp.toLowerCase();
    /*eslint-enable*/
  },

  /**
   * Replaces template strings with data.
   *
   * This is a cheap imitation of Twig's variable token replacement. It can
   * support nested data, e.g. {{ nested.object.property }}.
   *
   * @param {String} template
   *   The template string to use. Any "{{ variable }}" like tokens will be
   *   replaced with the corresponding data.
   * @param {Object} [data={}]
   *   The data to use for replacing variable tokens found in the template.
   * @param {Boolean} [remove=true]
   *   Flag indicating whether or not tokens will be removed if there is no
   *   corresponding data. If set to false, the original token will be
   *   returned instead.
   *
   * @return {String}
   *   A string representation of the template with data replaced.
   */
  template(template, data = {}, remove = true) {
    return template.replace(/[{][{] ([\w._-]+) [}][}]/gmi, function (token, name) {
      let value = Utility.getProperty(name, data);
      if (value !== null) {
        return value;
      }
      return remove ? '' : token;
    });
  },

  tick(callback) {
    global.setImmediate(callback);
  },

  /**
   * Ensures that a value is of a certain instance type.
   *
   * @param {*} value
   *   The value to check.
   * @param {String|Function} constructor
   *   The constructor object to test against. This can be a string value that
   *   will "require" it. If it cannot find the exported module, then it should
   *   be required beforehand and the constructor passed instead.
   * @param {Boolean} [throwError=true]
   *   Flag indicating whether or not to throw an error.
   *
   * @return {Boolean}
   *   True or thrown error or false if error argument is false.
   *
   * @throws {SyntaxError|ReferenceError|TypeError}
   *   Throws an error if the value does not pass the check.
   */
  typeCheck(value, constructor, throwError = true) {
    let error;
    let original = constructor;

    if (!error && !Utility.isFunction(constructor)) {
      error = new SyntaxError(`The "constructor" passed must be a function: ${constructor}`);
    }
    else if (!error && !(value instanceof constructor)) {
      error = new TypeError(`The value passed must be an instance of ${typeof original === 'string' ? original : original.name}.`);
    }

    if (error && throwError) {
      throw error;
    }

    return !error;
  }

};

export default Utility;
