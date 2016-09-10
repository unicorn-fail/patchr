/*!
 * patchr v0.1.0
 * Copyright (c) 2016-2020 Mark Carver (https://www.drupal.org/u/markcarver)
 * Licensed under MIT (https://github.com/unicorn-fail/patchr/blob/latest/LICENSE-MIT)
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Patchr = f()}})(function(){
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
'use strict';

// there's 3 implementations written in increasing order of efficiency

// 1 - no Set type is defined
function uniqNoSet(arr) {
	var ret = [];

	for (var i = 0; i < arr.length; i++) {
		if (ret.indexOf(arr[i]) === -1) {
			ret.push(arr[i]);
		}
	}

	return ret;
}

// 2 - a simple Set type is defined
function uniqSet(arr) {
	var seen = new Set();
	return arr.filter(function (el) {
		if (!seen.has(el)) {
			seen.add(el);
			return true;
		}

		return false;
	});
}

// 3 - a standard Set type is defined and it has a forEach method
function uniqSetWithForEach(arr) {
	var ret = [];

	(new Set(arr)).forEach(function (el) {
		ret.push(el);
	});

	return ret;
}

// V8 currently has a broken implementation
// https://github.com/joyent/node/issues/8449
function doesForEachActuallyWork() {
	var ret = false;

	(new Set([true])).forEach(function (el) {
		ret = el;
	});

	return ret === true;
}

if ('Set' in global) {
	if (typeof Set.prototype.forEach === 'function' && doesForEachActuallyWork()) {
		module.exports = uniqSetWithForEach;
	} else {
		module.exports = uniqSet;
	}
} else {
	module.exports = uniqNoSet;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
var setProperty = function setProperty(target, options) {
	if (defineProperty && options.name === '__proto__') {
		defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
	} else {
		target[options.name] = options.newValue;
	}
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
var getProperty = function getProperty(obj, name) {
	if (name === '__proto__') {
		if (!hasOwn.call(obj, name)) {
			return void 0;
		} else if (gOPD) {
			// In early versions of node, obj['__proto__'] is buggy when obj has
			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
			return gOPD(obj, name).value;
		}
	}

	return obj[name];
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						setProperty(target, { name: name, newValue: copy });
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],3:[function(require,module,exports){
module.exports = {
    parse: require('./lib/parse'),
    stringify: require('./lib/stringify')
};

},{"./lib/parse":5,"./lib/stringify":6}],4:[function(require,module,exports){
var attrRE = /([\w-]+)|=|(['"])([.\s\S]*?)\2/g;
var voidElements = require('void-elements');

module.exports = function (tag) {
    var i = 0;
    var key;
    var expectingValueAfterEquals = true;
    var res = {
        type: 'tag',
        name: '',
        voidElement: false,
        attrs: {},
        children: []
    };

    tag.replace(attrRE, function (match) {
        if (match === '=') {
            expectingValueAfterEquals = true;
            i++;
            return;
        }

        if (!expectingValueAfterEquals) {
            if (key) {
                res.attrs[key] = key; // boolean attribute
            }
            key=match;
        } else {
            if (i === 0) {
                if (voidElements[match] || tag.charAt(tag.length - 2) === '/') {
                    res.voidElement = true;
                }
                res.name = match;
            } else {
                res.attrs[key] = match.replace(/^['"]|['"]$/g, '');
                key=undefined;
            }
        }
        i++;
        expectingValueAfterEquals = false;
    });

    return res;
};

},{"void-elements":24}],5:[function(require,module,exports){
/*jshint -W030 */
var tagRE = /(?:<!--[\S\s]*?-->|<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>)/g;
var parseTag = require('./parse-tag');
// re-used obj for quick lookups of components
var empty = Object.create ? Object.create(null) : {};
// common logic for pushing a child node onto a list
function pushTextNode(list, html, level, start, ignoreWhitespace) {
    // calculate correct end of the content slice in case there's
    // no tag after the text node.
    var end = html.indexOf('<', start);
    var content = html.slice(start, end === -1 ? undefined : end);
    // if a node is nothing but whitespace, collapse it as the spec states:
    // https://www.w3.org/TR/html4/struct/text.html#h-9.1
    if (/^\s*$/.test(content)) {
        content = ' ';
    }
    // don't add whitespace-only text nodes if they would be trailing text nodes
    // or if they would be leading whitespace-only text nodes:
    //  * end > -1 indicates this is not a trailing text node
    //  * leading node is when level is -1 and list has length 0
    if ((!ignoreWhitespace && end > -1 && level + list.length >= 0) || content !== ' ') {
        list.push({
            type: 'text',
            content: content
        });
    }
}

module.exports = function parse(html, options) {
    options || (options = {});
    options.components || (options.components = empty);
    var result = [];
    var current;
    var level = -1;
    var arr = [];
    var byTag = {};
    var inComponent = false;

    html.replace(tagRE, function (tag, index) {
        if (inComponent) {
            if (tag !== ('</' + current.name + '>')) {
                return;
            } else {
                inComponent = false;
            }
        }

        var isOpen = tag.charAt(1) !== '/';
        var isComment = tag.indexOf('<!--') === 0;
        var start = index + tag.length;
        var nextChar = html.charAt(start);
        var parent;

        if (isOpen && !isComment) {
            level++;

            current = parseTag(tag);
            if (current.type === 'tag' && options.components[current.name]) {
                current.type = 'component';
                inComponent = true;
            }

            if (!current.voidElement && !inComponent && nextChar && nextChar !== '<') {
                pushTextNode(current.children, html, level, start, options.ignoreWhitespace);
            }

            byTag[current.tagName] = current;

            // if we're at root, push new base node
            if (level === 0) {
                result.push(current);
            }

            parent = arr[level - 1];

            if (parent) {
                parent.children.push(current);
            }

            arr[level] = current;
        }

        if (isComment || !isOpen || current.voidElement) {
            if (!isComment) {
                level--;
            }
            if (!inComponent && nextChar !== '<' && nextChar) {
                // trailing text node
                // if we're at the root, push a base text node. otherwise add as
                // a child to the current node.
                parent = level === -1 ? result : arr[level].children;
                pushTextNode(parent, html, level, start, options.ignoreWhitespace);
            }
        }
    });

    // If the "html" passed isn't actually html, add it as a text node.
    if (!result.length && html.length) {
        pushTextNode(result, html, 0, 0, options.ignoreWhitespace);
    }

    return result;
};

},{"./parse-tag":4}],6:[function(require,module,exports){
function attrString(attrs) {
    var buff = [];
    for (var key in attrs) {
        buff.push(key + '="' + attrs[key] + '"');
    }
    if (!buff.length) {
        return '';
    }
    return ' ' + buff.join(' ');
}

function stringify(buff, doc) {
    switch (doc.type) {
    case 'text':
        return buff + doc.content;
    case 'tag':
        buff += '<' + doc.name + (doc.attrs ? attrString(doc.attrs) : '') + (doc.voidElement ? '/>' : '>');
        if (doc.voidElement) {
            return buff;
        }
        return buff + doc.children.reduce(stringify, '') + '</' + doc.name + '>';
    }
}

module.exports = function (doc) {
    return doc.reduce(function (token, rootEl) {
        return token + stringify('', rootEl);
    }, '');
};

},{}],7:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],8:[function(require,module,exports){
'use strict';

var v4 = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}';
var v6 = '(?:(?:[0-9a-fA-F:]){1,4}(?:(?::(?:[0-9a-fA-F]){1,4}|:)){2,7})+';

var ip = module.exports = function (opts) {
	opts = opts || {};
	return opts.exact ? new RegExp('(?:^' + v4 + '$)|(?:^' + v6 + '$)') :
	                    new RegExp('(?:' + v4 + ')|(?:' + v6 + ')', 'g');
};

ip.v4 = function (opts) {
	opts = opts || {};
	return opts.exact ? new RegExp('^' + v4 + '$') : new RegExp(v4, 'g');
};

ip.v6 = function (opts) {
	opts = opts || {};
	return opts.exact ? new RegExp('^' + v6 + '$') : new RegExp(v6, 'g');
};

},{}],9:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  if (!fn) {
    return false
  }
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],10:[function(require,module,exports){
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

var isObject = require('isobject');

function isObjectObject(o) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = function isPlainObject(o) {
  var ctor,prot;

  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};

},{"isobject":12}],11:[function(require,module,exports){
"use strict";

/**
 * isUndefined
 * Checks if a value is undefined or not.
 *
 * @name isUndefined
 * @function
 * @param {Anything} input The input value.
 * @returns {Boolean} `true`, if the input is `undefined`, `false` otherwise.
 */

var u = void 0;
module.exports = function (input) {
  return input === u;
};
},{}],12:[function(require,module,exports){
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

module.exports = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

},{}],13:[function(require,module,exports){
module.exports.param = require('./lib/param.js').param;
module.exports.deparam = require('./lib/deparam.js').deparam;

},{"./lib/deparam.js":14,"./lib/param.js":15}],14:[function(require,module,exports){
/* global unescape */
'use strict';
exports.deparam = function(params, coerce) {
  var obj = {};
  var coerceTypes = {
    true: !0,
    false: !1,
    null: null,
  };

  if (typeof params !== 'string') {
    return obj;
  }
  if (typeof coerce === 'undefined') {
    coerce = true;
  }

  function safeDecodeURIComponent(component) {
    var returnvalue = '';
    try {
      returnvalue = decodeURIComponent(component);
    } catch (e) {
      returnvalue = unescape(component);
    }
    return returnvalue;
  }

  // Iterate over all name=value pairs.
  params.replace(/\+/g, ' ').split('&').forEach(function(element) {
    var param = element.split('=');
    var key = safeDecodeURIComponent(param[0]);
    var val;
    var cur = obj;
    var i = 0;

    // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
    // into its component parts.
    var keys = key.split('][');
    var keysLast = keys.length - 1;

    // If the first keys part contains [ and the last ends with ], then []
    // are correctly balanced.
    if (/\[/.test(keys[0]) && /\]$/.test(keys[keysLast])) {
      // Remove the trailing ] from the last keys part.
      keys[keysLast] = keys[keysLast].replace(/\]$/, '');
      // Split first keys part into two parts on the [ and add them back onto
      // the beginning of the keys array.
      keys = keys.shift().split('[').concat(keys);
      keysLast = keys.length - 1;
    } else {
      // Basic 'foo' style key.
      keysLast = 0;
    }
    // Are we dealing with a name=value pair, or just a name?
    if (param.length === 2) {
      val = safeDecodeURIComponent(param[1]);
      // Coerce values.
      if (coerce) {
        val = val && !isNaN(val)           ? +val             // number
          : val === 'undefined'            ? undefined        // undefined
          : coerceTypes[val] !== undefined ? coerceTypes[val] // true, false, null
          : val;                                              // string
      }
      if (keysLast) {
        // Complex key, build deep object structure based on a few rules:
        // * The 'cur' pointer starts at the object top-level
        // * [] = array push (n is set to array length), [n] = array if n is
        //   numeric, otherwise object.
        // * If at the last keys part, set the value.
        // * For each keys part, if the current level is undefined create an
        //   object or array based on the type of the next keys part.
        // * Move the 'cur' pointer to the next level.
        // * Rinse & repeat.
        for (; i <= keysLast; i++) {
          key = keys[i] === '' ?
            cur.length :
            keys[i];
          cur = cur[key] = i < keysLast ?
            cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ?
                           {} :
                           []
                        ) :
            val;
        }
      } else {
        // Simple key, even simpler rules, since only scalars and shallow
        // arrays are allowed.
        if (Array.isArray(obj[key])) {
          // val is already an array, so push on the next value.
          obj[key].push(val);
        } else if (obj[key] !== undefined) {
          // val isn't an array, but since a second value has been specified,
          // convert val into an array.
          obj[key] = [
            obj[key],
            val
          ];
        } else {
          // val is a scalar.
          obj[key] = val;
        }
      }
    } else if (key) {
      // No value was defined, so set something meaningful.
      obj[key] = coerce ? undefined : '';
    }
  });
  return obj;
};

},{}],15:[function(require,module,exports){
'use strict';

module.exports.param = function(sourceObject) {
  var prefix;
  var querystring = [];
  var r20 = /%20/g;
  var rbracket = /\[\]$/;

  function add(key, value) {
    // If value is a function, invoke it and return its value
    value = (typeof value === 'function') ?
      value() :
      value === null ?
        '' :
        value;
    querystring[querystring.length] = encodeURIComponent(key) +
      '=' + encodeURIComponent(value);
  }

  function buildParams(prefix, obj, add) {
    var name;
    if (Array.isArray(obj)) {
      // Serialize array item.
      for (var index = 0; index < obj.length; index++)
      {
        if (rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, obj[index]);
        } else {
          // Item is non-scalar (array or object), encode its numeric index.
          buildParams(prefix + '[' + (typeof (obj[index]) === 'object' ?
                                        index :
                                        ''
                                     ) + ']', obj[index], add);
        }
      }
    } else if (typeof obj === 'object') {
      // Serialize object item.
      for (name in obj) {
        buildParams(prefix + '[' + name + ']', obj[name], add);
      }
    } else {
      // Serialize scalar item.
      add(prefix, obj);
    }
  }

  // encode params recursively.
  for (prefix in sourceObject) {
    buildParams(prefix, sourceObject[prefix], add);
  }
  // Return the resulting serialization
  return querystring.join('&').replace(r20, '+');
};

},{}],16:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],17:[function(require,module,exports){
(function (setImmediate){
'use strict';



function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Promise constructor\'s argument is not a function');
  }
  this._40 = 0;
  this._65 = 0;
  this._55 = null;
  this._72 = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._37 = null;
Promise._87 = null;
Promise._61 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
}
function handle(self, deferred) {
  while (self._65 === 3) {
    self = self._55;
  }
  if (Promise._37) {
    Promise._37(self);
  }
  if (self._65 === 0) {
    if (self._40 === 0) {
      self._40 = 1;
      self._72 = deferred;
      return;
    }
    if (self._40 === 1) {
      self._40 = 2;
      self._72 = [self._72, deferred];
      return;
    }
    self._72.push(deferred);
    return;
  }
  handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
  setImmediate(function() {
    var cb = self._65 === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._65 === 1) {
        resolve(deferred.promise, self._55);
      } else {
        reject(deferred.promise, self._55);
      }
      return;
    }
    var ret = tryCallOne(cb, self._55);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._65 = 3;
      self._55 = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._65 = 1;
  self._55 = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._65 = 2;
  self._55 = newValue;
  if (Promise._87) {
    Promise._87(self, newValue);
  }
  finale(self);
}
function finale(self) {
  if (self._40 === 1) {
    handle(self, self._72);
    self._72 = null;
  }
  if (self._40 === 2) {
    for (var i = 0; i < self._72.length; i++) {
      handle(self, self._72[i]);
    }
    self._72 = null;
  }
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  });
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}

}).call(this,require("timers").setImmediate)
},{"timers":22}],18:[function(require,module,exports){
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js');

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new Promise(Promise._61);
  p._65 = 1;
  p._55 = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._65 === 3) {
            val = val._55;
          }
          if (val._65 === 1) return res(i, val._55);
          if (val._65 === 2) reject(val._55);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};

},{"./core.js":17}],19:[function(require,module,exports){
'use strict';

var Promise = require('./core.js');

module.exports = Promise;
Promise.prototype['finally'] = function (f) {
  return this.then(function (value) {
    return Promise.resolve(f()).then(function () {
      return value;
    });
  }, function (err) {
    return Promise.resolve(f()).then(function () {
      throw err;
    });
  });
};

},{"./core.js":17}],20:[function(require,module,exports){
'use strict';

var Promise = require('./core');

var DEFAULT_WHITELIST = [
  ReferenceError,
  TypeError,
  RangeError
];

var enabled = false;
exports.disable = disable;
function disable() {
  enabled = false;
  Promise._37 = null;
  Promise._87 = null;
}

exports.enable = enable;
function enable(options) {
  options = options || {};
  if (enabled) disable();
  enabled = true;
  var id = 0;
  var displayId = 0;
  var rejections = {};
  Promise._37 = function (promise) {
    if (
      promise._65 === 2 && // IS REJECTED
      rejections[promise._51]
    ) {
      if (rejections[promise._51].logged) {
        onHandled(promise._51);
      } else {
        clearTimeout(rejections[promise._51].timeout);
      }
      delete rejections[promise._51];
    }
  };
  Promise._87 = function (promise, err) {
    if (promise._40 === 0) { // not yet handled
      promise._51 = id++;
      rejections[promise._51] = {
        displayId: null,
        error: err,
        timeout: setTimeout(
          onUnhandled.bind(null, promise._51),
          // For reference errors and type errors, this almost always
          // means the programmer made a mistake, so log them after just
          // 100ms
          // otherwise, wait 2 seconds to see if they get handled
          matchWhitelist(err, DEFAULT_WHITELIST)
            ? 100
            : 2000
        ),
        logged: false
      };
    }
  };
  function onUnhandled(id) {
    if (
      options.allRejections ||
      matchWhitelist(
        rejections[id].error,
        options.whitelist || DEFAULT_WHITELIST
      )
    ) {
      rejections[id].displayId = displayId++;
      if (options.onUnhandled) {
        rejections[id].logged = true;
        options.onUnhandled(
          rejections[id].displayId,
          rejections[id].error
        );
      } else {
        rejections[id].logged = true;
        logError(
          rejections[id].displayId,
          rejections[id].error
        );
      }
    }
  }
  function onHandled(id) {
    if (rejections[id].logged) {
      if (options.onHandled) {
        options.onHandled(rejections[id].displayId, rejections[id].error);
      } else if (!rejections[id].onUnhandled) {
        console.warn(
          'Promise Rejection Handled (id: ' + rejections[id].displayId + '):'
        );
        console.warn(
          '  This means you can ignore any previous messages of the form "Possible Unhandled Promise Rejection" with id ' +
          rejections[id].displayId + '.'
        );
      }
    }
  }
}

function logError(id, error) {
  console.warn('Possible Unhandled Promise Rejection (id: ' + id + '):');
  var errStr = (error && (error.stack || error)) + '';
  errStr.split('\n').forEach(function (line) {
    console.warn('  ' + line);
  });
}

function matchWhitelist(error, list) {
  return list.some(function (cls) {
    return error instanceof cls;
  });
}
},{"./core":17}],21:[function(require,module,exports){
(function (process,global){
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":16}],22:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":16,"timers":22}],23:[function(require,module,exports){
'use strict';
var ipRegex = require('ip-regex');

module.exports = function (opts) {
	opts = opts || {};

	var protocol = '(?:(?:[a-z]+:)?//)';
	var auth = '(?:\\S+(?::\\S*)?@)?';
	var ip = ipRegex.v4().source;
	var host = '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)';
	var domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*';
	var tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))';
	var port = '(?::\\d{2,5})?';
	var path = '(?:[/?#][^\\s"]*)?';
	var regex = [
		'(?:' + protocol + '|www\\.)' + auth, '(?:localhost|' + ip + '|' + host + domain + tld + ')',
		port, path
	].join('');

	return opts.exact ? new RegExp('(?:^' + regex + '$)', 'i') :
						new RegExp(regex, 'ig');
};

},{"ip-regex":8}],24:[function(require,module,exports){
/**
 * This file automatically generated from `pre-publish.js`.
 * Do not manually edit.
 */

module.exports = {
  "area": true,
  "base": true,
  "br": true,
  "col": true,
  "embed": true,
  "hr": true,
  "img": true,
  "input": true,
  "keygen": true,
  "link": true,
  "menuitem": true,
  "meta": true,
  "param": true,
  "source": true,
  "track": true,
  "wbr": true
};

},{}],25:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);



var Attributes = function () {

  /**
   * @class Attributes
   *
   * @param {Attributes|Object} [attributes]
   *   An Attributes object with existing data or a plain object where the key
   *   is the attribute name and the value is the attribute value.
   *
   * @constructor
   */
  function Attributes() {
    var attributes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Attributes);

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


  _createClass(Attributes, [{
    key: 'toString',
    value: function toString() {
      var output = '';
      var name = void 0;
      var value = void 0;
      for (name in this.data) {
        if (!this.data.hasOwnProperty(name)) {
          continue;
        }
        value = this.data[name];
        if (_Utility2.default.isFunction(value)) {
          value = value.call(this);
        }
        if (_Utility2.default.isObject(value)) {
          var values = [];
          for (var i in value) {
            if (value.hasOwnProperty(i)) {
              values.push(value[i]);
            }
          }
          value = values;
        }
        if (_Utility2.default.isArray(value)) {
          value = value.join(' ');
        }
        // Don't add an empty class array.
        if (name === 'class' && !value) {
          continue;
        }
        output += ' ' + _Utility2.default.encodeHtmlEntities(name) + '="' + _Utility2.default.encodeHtmlEntities(value) + '"';
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

  }, {
    key: 'addClass',
    value: function addClass(value) {
      var args = Array.prototype.slice.call(arguments);
      var classes = [];
      for (var i = 0, l = args.length; i < l; i++) {
        classes = classes.concat(_Utility2.default.sanitizeClasses(args[i]));
      }
      this.data['class'] = _Utility2.default.arrayUniq(this.data['class'].concat(classes));
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

  }, {
    key: 'exists',
    value: function exists(name) {
      return !_Utility2.default.isUndefined(this.data[name]) && this.data[name] !== null;
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

  }, {
    key: 'get',
    value: function get(name, defaultValue) {
      if (!this.exists(name)) {
        this.data[name] = !_Utility2.default.isUndefined(defaultValue) ? defaultValue : null;
      }
      return this.data[name];
    }

    /**
     * Retrieves a cloned copy of the internal attributes data object.
     *
     * @return {Object}
     *   The cloned copy of the attribute data.
     */

  }, {
    key: 'getData',
    value: function getData() {
      return _Utility2.default.extend({}, this.data);
    }

    /**
     * Retrieves classes from the Attributes object.
     *
     * @return {Array}
     *   The classes array.
     */

  }, {
    key: 'getClasses',
    value: function getClasses() {
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

  }, {
    key: 'hasClass',
    value: function hasClass(className) {
      className = _Utility2.default.sanitizeClasses(className);
      var classes = this.getClasses();
      for (var i = 0, l = className.length; i < l; i++) {
        // If one of the classes fails, immediately return false.
        if (_Utility2.default.indexOf(classes, className[i]) === -1) {
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

  }, {
    key: 'merge',
    value: function merge(attributes, recursive) {
      attributes = attributes instanceof Attributes ? attributes.getData() : attributes;

      // Ensure any passed are sanitized.
      if (attributes && !_Utility2.default.isUndefined(attributes['class'])) {
        attributes['class'] = _Utility2.default.sanitizeClasses(attributes['class']);
      }

      if (_Utility2.default.isUndefined(recursive) || recursive) {
        this.data = _Utility2.default.extend(true, {}, this.data, attributes);
      } else {
        this.data = _Utility2.default.extend({}, this.data, attributes);
      }

      // Ensure classes are unique after merge.
      this.data['class'] = _Utility2.default.arrayUniq(this.data['class']);

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

  }, {
    key: 'remove',
    value: function remove(name) {
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

  }, {
    key: 'removeClass',
    value: function removeClass(value) {
      var args = Array.prototype.slice.apply(arguments);
      var classes = this.getClasses();
      var values = [];
      for (var i = 0, l = args.length; i < l; i++) {
        values = values.concat(_Utility2.default.sanitizeClasses(args[i]));
        for (var ii = 0, ll = values.length; ii < ll; ii++) {
          var index = _Utility2.default.indexOf(classes, values[ii]);
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

  }, {
    key: 'replaceClass',
    value: function replaceClass(oldValue, newValue) {
      var classes = this.getClasses();
      var i = _Utility2.default.indexOf(classes, oldValue);
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

  }, {
    key: 'set',
    value: function set(name, value) {
      this.data[name] = name === 'class' ? _Utility2.default.sanitizeClasses(value) : value;
      return this;
    }
  }]);

  return Attributes;
}();

exports.default = Attributes;

},{"./Utility":43}],26:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});



var _Emitter2 = require('./Emitter');

var _Emitter3 = _interopRequireDefault(_Emitter2);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Base = function (_Emitter) {
  _inherits(Base, _Emitter);

  /**
   * @class Base
   *
   * @param {Object} [options={}]
   *   Options to override defaults.
   */
  function Base() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Base);

    /**
     * The options.
     *
     * @type {Object}
     */
    var _this = _possibleConstructorReturn(this, (Base.__proto__ || Object.getPrototypeOf(Base)).call(this));

    _this.options = _Utility2.default.extend(true, {}, options);
    return _this;
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


  _createClass(Base, [{
    key: 'emit',
    value: function emit(type) {
      var _this2 = this;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return this.promise(function (resolve, reject) {
        var _get2;

        if (!(_get2 = _get(Base.prototype.__proto__ || Object.getPrototypeOf(Base.prototype), 'emit', _this2)).call.apply(_get2, [_this2, type].concat(args))) {
          return reject(_this2);
        }
        resolve(_this2);
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

  }, {
    key: 'getOption',
    value: function getOption(name) {
      var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var ret = _Utility2.default.getProperty(name, this.options);
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

  }, {
    key: 'promise',
    value: function promise(resolver) {
      var promise = this.getOption('promise');
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

  }, {
    key: 'reject',
    value: function reject(value) {
      var promise = this.getOption('promise');
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

  }, {
    key: 'resolve',
    value: function resolve(value) {
      var promise = this.getOption('promise');
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

  }, {
    key: 'sanitize',
    value: function sanitize(string) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      // Always replace CRLF and CR characters with LF. This is necessary for
      // the parser to function properly, which assumes that everything is a LF.
      string = string.replace(/\r\n|\r/g, '\n');

      // Remove comments.
      if (force || this.getOption('sanitize.comments')) {
        string = string.replace(/^#[^\n]*\n/gm, '');
      }

      // Encode HTML entities.
      if (force || this.getOption('sanitize.encodeHtmlEntities')) {
        string = _Utility2.default.encodeHtmlEntities(string);
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

  }, {
    key: 'setOption',
    value: function setOption(name) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var p = name && name.split('.') || [];
      if (p.length === 1) {
        this.options[p[0]] = value;
        return this;
      }
      try {
        var obj = p.reduce(function (obj, i) {
          return !_Utility2.default.isPlainObject(obj[i]) ? obj : obj[i];
        }, this.options);
        obj[p[p.length - 1]] = value;
      } catch (e) {
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

  }, {
    key: 'typeCheck',
    value: function typeCheck(value, constructor) {
      var promise = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      if (!promise) {
        return _Utility2.default.typeCheck(value, constructor);
      }
      return this.promise(function (resolve, reject) {
        try {
          _Utility2.default.typeCheck(value, constructor);
          resolve(value);
        } catch (e) {
          reject(e);
        }
      });
    }
  }]);

  return Base;
}(_Emitter3.default);

exports.default = Base;

},{"./Emitter":29,"./Utility":43}],27:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});



var _Patchr = require('./Patchr');

var _Patchr2 = _interopRequireDefault(_Patchr);

var _Proxy2 = require('./Proxy');

var _Proxy3 = _interopRequireDefault(_Proxy2);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Diff = function (_Proxy) {
  _inherits(Diff, _Proxy);

  /**
   * @class Diff
   *
   * @param {String} name
   *   The name of the Diff object being sub-classed.
   * @param {String} string
   *   The raw diff string.
   * @param {Patchr|Diff} parent
   *   A parent Diff object this instance belongs to or a Patchr
   *   instance.
   * @param {String|Function<Diff>} [constructor=null]
   *   The constructor class used to ensure that when a parent instance is
   *   passed, it is of a certain type.
   *
   * @extends Proxy
   *
   * @constructor
   */
  function Diff(name, string) {
    var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var constructor = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    _classCallCheck(this, Diff);

    var patchr = void 0;
    if (_Utility2.default.isType(parent, _Patchr2.default)) {
      patchr = parent;
      parent = null;
    } else if (_Utility2.default.isType(parent, Diff)) {
      patchr = parent.patchr;
    } else {
      throw new Error('The "parent" argument passed must be an instance of either Patchr or Diff: ' + parent);
    }

    var _this = _possibleConstructorReturn(this, (Diff.__proto__ || Object.getPrototypeOf(Diff)).call(this, patchr));

    if (typeof string !== 'string') {
      throw new Error('The "string" argument passed must be a string: ' + string);
    }

    if (constructor) {
      _Utility2.default.typeCheck(parent, constructor);
    }

    /**
     * The parent Diff object this instance belongs to.
     *
     * Define this property so that it cannot be overridden or show up in
     * enumerations. It is meant solely for referencing purposes only.
     *
     * @type {Diff}
     */
    Object.defineProperty(_this, '__parent__', {
      value: parent,
      configurable: true,
      enumerable: false,
      writable: true
    });

    /**
     * The number additions.
     *
     * @type {Number}
     */
    _this.additions = 0;

    /**
     * The number of deletions.
     *
     * @type {Number}
     */
    _this.deletions = 0;

    /**
     * The array index associated with this object.
     *
     * @type {Number}
     */
    _this.index = null;

    /**
     * The machine name representation of the object.
     *
     * @type {String}
     */
    _this.name = name;

    /**
     * Flag indicating whether or not the instance has been parsed.
     *
     * @type {Boolean}
     */
    _this.parsed = false;

    /**
     * The un-altered string that was passed.
     *
     * @type {String}
     */
    _this.raw = string;

    /**
     * The un-altered byte size of the string that was passed.
     *
     * @type {Number}
     */
    _this.rawSize = string.length;

    /**
     * The SHA1 digest of the raw string.
     *
     * @type {String}
     */
    _this.sha1 = null;

    /**
     * The patch byte size, minute any meta information.
     *
     * @type {Number}
     */
    _this.size = 0;
    return _this;
  }

  /**
   * Creates a promised based parse task with start and end emitted events.
   *
   * @param {String} name
   *   The name of the parse task. It will be used as the emitted event and
   *   will be prepended with "parse" and appended with both a "start" and
   *   "stop" namespace. If no name is provided the emitted event will simply
   *   be "parse".
   * @param {Function} callback
   *   The parse callback that will be invoked inside the Promise. Once the
   *   parse task has ended, the return value of the task will be the object
   *   that originally invoked the task.
   *
   * @return {Promise}
   *   A Promise object.
   */


  _createClass(Diff, [{
    key: 'doParse',
    value: function doParse(name, callback) {
      var _this2 = this;

      if (this.parsed) {
        return this.resolve(this);
      }
      return this.doTask(name ? 'parse.' + name : 'parse', callback).then(function () {
        // To prevent potentially lengthy SHA1 execution time on large strings,
        // attempt to just use the name and index as the "identifier". Fallback
        // to the raw string value otherwise.
        _this2.sha1 = _Utility2.default.sha1(_this2.index !== null ? _this2.name + '-' + _this2.index : _this2.raw);
        _this2.parsed = true;
        return _this2.resolve(_this2);
      }).finally(function (value) {
        _this2.garbageCollect('parse');
        return value;
      });
    }

    /**
     * {@inheritDoc}
     *
     * @param {String} [type='default']
     *   The type of garbage collection.
     *
     * @return {Boolean}
     *   True or false.
     */

  }, {
    key: 'garbageCollect',
    value: function garbageCollect() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';

      var collect = _get(Diff.prototype.__proto__ || Object.getPrototypeOf(Diff.prototype), 'garbageCollect', this).call(this, type);
      if (collect) {
        if (type === 'parse') {
          this.raw = null;
        } else if (type === 'render') {
          this.__parent__ = null;
        }
      }
      return collect;
    }

    /**
     * Returns the parent Diff object, if any.
     *
     * @return {Diff|null}
     *   The parent Diff object or null if not set.
     */

  }, {
    key: 'getParent',
    value: function getParent() {
      return this.__parent__ instanceof Diff && this.__parent__ || null;
    }

    /**
     * Increases the addition stat.
     *
     * @param {Boolean} [bubble=true]
     *   Flag determining whether or not the addition should propagate upwards
     *   on parent instances.
     */

  }, {
    key: 'increaseAddition',
    value: function increaseAddition() {
      var bubble = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.additions++;
      if (bubble && this.__parent__) {
        this.__parent__.increaseAddition();
      }
    }

    /**
     * Increases the deletion stat.
     *
     * @param {Boolean} [bubble=true]
     *   Flag determining whether or not the addition should propagate upwards
     *   on parent instances.
     */

  }, {
    key: 'increaseDeletion',
    value: function increaseDeletion() {
      var bubble = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.deletions++;
      if (bubble && this.__parent__) {
        this.__parent__.increaseDeletion();
      }
    }

    /**
     * Parses a Diff object.
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'parse',
    value: function parse() {
      return this.doParse(this.name, _Utility2.default.noop);
    }

    /**
     * Function to help render consistent diff stats through out all the objects.
     *
     * @param {Object<Diff>} [object=this]
     *   An object to render stats for; it must be an instance of Diff.
     *   If no object was passed, then the instance that invoked this method will
     *   be used.
     *
     * @return {Element|String}
     *   The Element object containing the rendered HTML. Can be cast to
     *   a string value or manually invoked using the toString method.
     */

  }, {
    key: 'renderDiffStats',
    value: function renderDiffStats() {
      var object = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this;

      if (!(object instanceof Diff)) {
        throw new Error('The "object" argument passed is not an instance of Diff: ' + object);
      }
      return _Utility2.default.createElement('<span>').addClass('patchr-stat').append('<span class="patchr-stat-additions" title="' + object.additions + ' additions">+' + object.additions + '</span>').append('<span class="patchr-stat-deletions" title="' + object.deletions + ' deletions">-' + object.deletions + '</span>');
    }
  }]);

  return Diff;
}(_Proxy3.default);

exports.default = Diff;

},{"./Patchr":37,"./Proxy":38,"./Utility":43}],28:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});



// Local imports.


var _voidElements = require('void-elements');

var _voidElements2 = _interopRequireDefault(_voidElements);

var _Attributes = require('./Attributes');

var _Attributes2 = _interopRequireDefault(_Attributes);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);



var Element = function () {

  /**
   * @class Element
   *
   * @param {String|Object} [tag=null]
   *   The element tag name or an AST object from html-parse-stringify2.
   *
   * @constructor
   */
  function Element() {
    var tag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    _classCallCheck(this, Element);

    var ast = _Utility2.default.isObject(tag) ? tag : {
      type: 'tag',
      name: tag,
      voidElement: !!_voidElements2.default[tag],
      attrs: {},
      children: []
    };

    if (ast.type === 'tag' && typeof ast.name !== 'string') {
      throw new Error('You must pass a string tag name when creating a tag element: ' + ast.name);
    }

    /**
     * The Attributes object for this instance.
     *
     * @type {Attributes}
     */
    this.attributes = new _Attributes2.default(ast.attrs);

    /**
     * The child Element objects, if any.
     *
     * @type {Array}
     */
    this.children = [];

    // Create necessary child elements.
    if (ast.type === 'tag') {
      for (var i = 0, l = ast.children.length; i < l; i++) {
        this.children.push(new Element(ast.children[i]));
      }
    }

    /**
     * The text content of the element, if any.
     *
     * @type {String}
     */
    this.content = ast.type === 'text' && ast.content || '';

    /**
     * Flag determining whether or not the element should be rendered.
     *
     * @type {boolean}
     */
    this.enabled = true;

    /**
     * The name of the tag element to construct.
     *
     * @type {String}
     */
    this.name = ast.type === 'tag' && ast.name;

    /**
     * The rendered output.
     *
     * @type {String}
     */
    this.rendered = null;

    /**
     * The type of element.
     *
     * Can be either "tag" or "text".
     *
     * @type {String}
     */
    this.type = ast.type;

    /**
     * Flag indicating whether or not this is a void element.
     *
     * @type {Boolean}
     *   True or false.
     */
    this.voidElement = ast.voidElement;
  }

  /**
   * Add class(es) to the element's Attributes object.
   *
   * @param {...String|Array} value
   *   An individual class or an array of classes to add.
   *
   * @return {Element|String}
   *   The Element instance.
   *
   * @chainable
   */


  _createClass(Element, [{
    key: 'addClass',
    value: function addClass(value) {
      this.attributes.addClass.apply(this.attributes, arguments);
      return this;
    }

    /**
     * Appends content to this element as a child Element object.
     *
     * @param {Element|Object|String} [content=null]
     *   The content used to create the element. Can be an existing Element
     *   object, an AST object from html-parse-stringify2 or a string containing
     *   fully enclosed/valid HTML.
     * @param {Boolean} [raw=false]
     *   Whether or not to simply add the content as a raw value to be rendered.
     *   This is only useful if whitespace needs to be preserved.
     *
     * @return {Element|String}
     *   The Element instance.
     */

  }, {
    key: 'append',
    value: function append() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var raw = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var elements = raw ? new Element({
        type: 'text',
        content: content.toString()
      }) : Element.create(content);
      if (elements instanceof Array) {
        for (var i = 0, l = elements.length; i < l; i++) {
          this.children.push(elements[i]);
        }
      } else if (elements instanceof Element) {
        this.children.push(elements);
      }
      return this;
    }

    /**
     * Appends this element as a child of the provided Element object.
     *
     * @param {Element} element
     *   The Element object to append this object inside of.
     *
     * @return {Element|String}
     *   The Element instance.
     */

  }, {
    key: 'appendTo',
    value: function appendTo(element) {
      if (!(element instanceof Element)) {
        throw new Error('You can only append to another Element instance.');
      }
      element.append(this);
      return this;
    }

    /**
     * Clones a Element object.
     *
     * @return {Element}
     *   The cloned Element instance.
     *
     * @chainable
     */

  }, {
    key: 'clone',
    value: function clone() {
      var clone = new Element(this.name).setAttributes(this.attributes.getData());
      if (this.content) {
        clone.content = this.content;
      }
      for (var i = 0, l = this.children.length; i < l; i++) {
        clone.children.push(this.children[i].clone());
      }
      return clone;
    }

    /**
     * Disables an element from rendering.
     *
     * @return {Element|String}
     *   The Element instance.
     *
     * @chainable
     */

  }, {
    key: 'disable',
    value: function disable() {
      this.enabled = false;
      return this;
    }

    /**
     * Enables an element for rendering.
     *
     * @return {Element|String}
     *   The Element instance.
     *
     * @chainable
     */

  }, {
    key: 'enable',
    value: function enable() {
      this.enabled = true;
      return this;
    }

    /**
     * Retrieve a specific attribute from the element's Attributes object.
     *
     * @param {String} name
     *   The specific attribute to retrieve.
     * @param {*} [defaultValue=null]
     *   (optional) The default value to set if the attribute does not exist.
     *
     * @return {*}
     *   A specific attribute value, passed by reference.
     */

  }, {
    key: 'getAttribute',
    value: function getAttribute(name, defaultValue) {
      return this.attributes.get.apply(this.attributes, arguments);
    }

    /**
     * Retrieves classes from the element's Attributes object.
     *
     * @return {Array}
     *   The classes array.
     */

  }, {
    key: 'getClasses',
    value: function getClasses() {
      return this.attributes.getClasses.apply(this.attributes, arguments);
    }

    /**
     * Indicates whether an attribute exists in the element's Attributes object.
     *
     * @param {String} name
     *   An attribute name to check.
     *
     * @return {Boolean}
     *   True or false.
     */

  }, {
    key: 'hasAttribute',
    value: function hasAttribute(name) {
      return this.attributes.exists.apply(this.attributes, arguments);
    }

    /**
     * Indicates whether a class is present in the element's Attributes object.
     *
     * @param {String|Array} className
     *   The class name(s) to search for.
     *
     * @return {Boolean}
     *   True or false.
     */

  }, {
    key: 'hasClass',
    value: function hasClass(className) {
      return this.attributes.hasClass.apply(this.attributes, arguments);
    }

    /**
     * Sets or retrieves the inner HTML content (children) of this element.
     *
     * @param {Element|Object|String} [content=null]
     *   The content used to create the element. Can be an existing Element
     *   object, an AST object from html-parse-stringify2 or a string containing
     *   fully enclosed/valid HTML.
     * @param {Boolean} [raw=false]
     *   Whether or not to simply add the content as a raw value to be rendered.
     *   This is only useful if whitespace needs to be preserved.
     *
     * @return {Element|String}
     *   If no content was provided, then the current value of the element's inner
     *   HTML (children) will be rendered. If content was provided, then the
     *   Element instance will be returned.
     *
     * @chainable
     */

  }, {
    key: 'html',
    value: function html() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var raw = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      // If any argument was provided, then it's in "set" mode.
      if (!_Utility2.default.isUndefined(content)) {
        // Clear out any children or content.
        this.children = [];
        this.content = null;
        // Only set the content if there's content.
        if (content) {
          this.append(content, raw);
        }
        return this;
      } else {
        var output = '';
        for (var i = 0, l = this.children; i < l; i++) {
          output += this.children[i].toString();
        }
        return output;
      }
    }

    /**
     * Prepends content to this element as a child Element object.
     *
     * @param {Element|Object|String} [content=null]
     *   The content used to create the element. Can be an existing Element
     *   object, an AST object from html-parse-stringify2 or a string containing
     *   fully enclosed/valid HTML.
     * @param {Boolean} [raw=false]
     *   Whether or not to simply add the content as a raw value to be rendered.
     *   This is only useful if whitespace needs to be preserved.
     *
     * @return {Element|String}
     *   The Element instance.
     */

  }, {
    key: 'prepend',
    value: function prepend() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var raw = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var elements = raw ? new Element({
        type: 'text',
        content: content.toString()
      }) : Element.create(content);
      if (elements instanceof Array) {
        for (var l = elements.length; l > 0; l--) {
          this.children.unshift(elements[l]);
        }
      } else if (elements instanceof Element) {
        this.children.unshift(elements);
      }
      return this;
    }

    /**
     * Prepends this element as a child of the provided Element object.
     *
     * @param {Element} element
     *   The Element object to prepend this object inside of.
     *
     * @return {Element|String}
     *   The Element instance.
     */

  }, {
    key: 'prependTo',
    value: function prependTo(element) {
      if (!(element instanceof Element)) {
        throw new Error('You can only prepend to another Element instance.');
      }
      element.prepend(this);
      return this;
    }

    /**
     * Removes an attribute from the Attributes object.
     *
     * @param {String} name
     *   The name of the attribute to remove.
     *
     * @return {Element|String}
     *   The Element instance.
     *
     * @chainable
     */

  }, {
    key: 'removeAttribute',
    value: function removeAttribute(name) {
      this.attributes.remove.apply(this.attributes, arguments);
      return this;
    }

    /**
     * Removes a class from the element's Attributes object.
     *
     * @param {...String|Array} value
     *   An individual class or an array of classes to remove.
     *
     * @return {Element|String}
     *   The Element instance.
     *
     * @chainable
     */

  }, {
    key: 'removeClass',
    value: function removeClass(value) {
      this.attributes.removeClass.apply(this.attributes, arguments);
      return this;
    }

    /**
     * Replaces a class in the element's Attributes object.
     *
     * @param {String} oldValue
     *   The old class to remove.
     * @param {String} newValue
     *   The new class. It will not be added if the old class does not exist.
     *
     * @return {Element|String}
     *   The Element instance.
     *
     * @chainable
     */

  }, {
    key: 'replaceClass',
    value: function replaceClass(oldValue, newValue) {
      this.attributes.replaceClass.apply(this.attributes, arguments);
      return this;
    }

    /**
     * Sets an attribute on the element's Attributes object.
     *
     * @param {String} name
     *   The name of the attribute to set.
     * @param {*} value
     *   The value of the attribute to set.
     *
     * @return {Element|String}
     *   The Element instance.
     *
     * @chainable
     */

  }, {
    key: 'setAttribute',
    value: function setAttribute(name, value) {
      this.attributes.set.apply(this.attributes, arguments);
      return this;
    }

    /**
     * Sets an attribute on the element's Attributes object.
     *
     * @param {Attributes|Object} attributes
     *   An Attributes object with existing data or a plain object where the key
     *   is the attribute name and the value is the attribute value.
     *
     * @return {Element|String}
     *   The Element instance.
     *
     * @chainable
     */

  }, {
    key: 'setAttributes',
    value: function setAttributes(attributes) {
      this.attributes.merge.apply(this.attributes, arguments);
      return this;
    }

    /**
     * Sets or retrieves the text value of the element.
     *
     * @param {String|*} [string]
     *   The text string to set. Any HTML will be escaped.
     *
     * @return {Element|String}
     *   If no string value was provided, then the current value of the element
     *   will be returned. If a string value was provided, then the Element
     *   instance will be returned.
     *
     * @chainable
     */

  }, {
    key: 'text',
    value: function text(string) {
      if (!_Utility2.default.isUndefined(string)) {
        this.children = [new Element({
          type: 'text',
          content: _Utility2.default.encodeHtmlEntities(string + '')
        })];
        return this;
      } else {
        var text = this.type === 'text' && this.content || '';
        for (var i = 0, l = this.children.length; i < l; i++) {
          if (this.children[i].type === 'text' && this.children[i].content) {
            text += this.children[i].text();
          }
        }
        return text;
      }
    }

    /**
     * Renders an element to a string.
     *
     * @param {Boolean} [reset=false]
     *   Resets any already rendered output and forces the element to be
     *   constructed again.
     *
     * @return {String}
     *   The rendered HTML output.
     */

  }, {
    key: 'toString',
    value: function toString() {
      var reset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      // Immediately return with the rendered output if set.
      if (!reset && this.rendered !== null) {
        return this.enabled ? this.rendered : '';
      }
      this.rendered = '';
      if (this.type === 'text' && this.content) {
        this.rendered += this.content;
      } else if (this.type === 'tag' && this.name) {
        // To ensure backwards XHTML compatibility, add a "self-closing" forward
        // slash for void elements. HTML5 ignores these anyway.
        this.rendered += '<' + this.name + this.attributes + (this.voidElement ? ' /' : '') + '>';

        // Only render children and close tag if this isn't a void element.
        if (this.name && !this.voidElement) {
          // Render any value or children.
          for (var i = 0, l = this.children.length; i < l; i++) {
            this.rendered += this.children[i].toString(reset);
          }
          this.rendered += '</' + this.name + '>';
        }
      }
      return this.enabled ? this.rendered : '';
    }
  }]);

  return Element;
}();

/**
 * Creates a new Element.
 *
 * @param {Element|Object|String} [content='']
 *   The content used to create the element. Can be an existing Element
 *   object, an AST object from html-parse-stringify2 or a string containing
 *   fully enclosed/valid HTML.
 *
 * @return {Element[]|Element|String}
 *   A new Element instance or an array of Element instances depending on if
 *   there are multiple top level elements, e.g.:
 *   <div class="item-1"></div><div class="item-2"></div>
 */


exports.default = Element;
Element.create = function create() {
  var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  // Immediately return if content is already an Element instance.
  if (content instanceof Element) {
    return content;
  }
  var elements = [];
  var ast = _Utility2.default.parseHtml(content);
  for (var i = 0, l = ast.length; i < l; i++) {
    elements[i] = new Element(ast[i]);
  }
  return elements.length === 1 ? elements[0] : elements;
};

},{"./Attributes":25,"./Utility":43,"void-elements":24}],29:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Event = require('./Event');

var _Event2 = _interopRequireDefault(_Event);



var Emitter = function () {

  /**
   * @class Emitter
   *
   * @constructor
   */
  function Emitter() {
    _classCallCheck(this, Emitter);

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


  _createClass(Emitter, [{
    key: 'emit',
    value: function emit(type) {
      if (!type || typeof type !== 'string') {
        throw new Error('Invalid event type: ' + type);
      }

      // Retrieve any listeners. Attempt to use any defined "patchr" property
      // first before attempting to use any defined "listeners" property.
      var listeners = [];

      // Find all potential listeners that match the event type.
      for (var name in this.listeners) {
        if (type.match(new RegExp(name))) {
          listeners = listeners.concat(this.listeners[name]);
        }
      }

      // Go ahead and return true if there are no listeners to invoke.
      if (!listeners.length) {
        return true;
      }

      // Create an event object.
      var event = new _Event2.default(type);

      // Set the object that emitted the event.
      event.setTarget(this);

      // Prepend arguments with the event object.

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      args.unshift(event);

      // Iterate over the listeners.
      for (var i = 0, l = listeners.length; i < l; i++) {
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

  }, {
    key: 'off',
    value: function off(type, listener) {
      var types = type.split(' ');
      for (var i = 0, l = types.length; i < l; i++) {
        var _type = types[i];

        // Continue if there is no event type.
        if (!this.listeners[_type]) {
          continue;
        }

        // Remove all events for a specific type.
        if (!listener) {
          this.listeners[_type] = [];
          continue;
        }

        // Remove a specific listener.
        for (var _i = 0, _l = this.listeners[_type].length; _i < _l; _i++) {
          if (this.listeners[_type][_i] === listener) {
            this.listeners[_type].splice(_i, 1);
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

  }, {
    key: 'on',
    value: function on(type, listener) {
      var types = type.split(' ');
      for (var i = 0, l = types.length; i < l; i++) {
        var _type2 = types[i];
        if (!this.listeners[_type2]) {
          this.listeners[_type2] = [];
        }
        this.listeners[_type2].push(listener);
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

  }, {
    key: 'once',
    value: function once(type, listener) {
      var once = function once() {
        this.off(type, once);
        listener.apply(this, arguments);
      };
      return this.on(type, once);
    }
  }]);

  return Emitter;
}();

exports.default = Emitter;

},{"./Event":30}],30:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var Event =

/**
 * @class Event
 *
 * @param {String} type
 *   The event type.
 *
 * @constructor
 */
function Event(type) {
  _classCallCheck(this, Event);

  // Read-only/internal variables.
  var defaultPrevented = false;
  var eventTarget = null;
  var namespace = type.split('.').filter(Boolean);
  var eventType = namespace.shift();
  Object.defineProperty(this, 'defaultPrevented', {
    get: function get() {
      return defaultPrevented;
    }
  });
  Object.defineProperty(this, 'namespace', { value: [''].concat(namespace).join('.') });
  Object.defineProperty(this, 'timeStamp', { value: Date.now() });
  Object.defineProperty(this, 'type', { value: eventType });
  Object.defineProperty(this, 'preventDefault', {
    value: function value() {
      defaultPrevented = true;
    }
  });
  Object.defineProperty(this, 'setTarget', {
    value: function value(object) {
      if (eventTarget === null) {
        eventTarget = object;
      }
    }
  });
  Object.defineProperty(this, 'target', {
    get: function get() {
      return eventTarget;
    }
  });
};

exports.default = Event;

},{}],31:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Hunk = require('./Hunk');

var _Hunk2 = _interopRequireDefault(_Hunk);

var _Patch = require('./Patch');

var _Patch2 = _interopRequireDefault(_Patch);

var _Renderable2 = require('./Renderable');

var _Renderable3 = _interopRequireDefault(_Renderable2);

var _Table = require('./Table');

var _Table2 = _interopRequireDefault(_Table);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var File = function (_Renderable) {
  _inherits(File, _Renderable);

  /**
   * @class File
   *
   * @param {Patch} patch
   *   The Patch instance this File belongs to.
   * @param {String} string
   *   The contents of a diff file section.
   *
   * @constructor
   */
  function File(patch, string) {
    _classCallCheck(this, File);

    /**
     * {@inheritDoc}
     *
     * @type {Object|Number}
     */
    var _this = _possibleConstructorReturn(this, (File.__proto__ || Object.getPrototypeOf(File)).call(this, 'file', string, patch, _Patch2.default));

    _this.border = 1;

    /**
     * The file extension.
     *
     * @type {String}
     */
    _this.extension = null;

    /**
     * The filename.
     *
     * @type {String}
     */
    _this.filename = null;

    /**
     * {@inheritDoc}
     *
     * @type {Number}
     */
    _this.height = 43; // Initial height for header.

    /**
     * {@inheritDoc}
     *
     * @type {Object|Number}
     */
    _this.margin = { top: 30 };

    /**
     * An array of Hunk objects.
     *
     * @type {Hunk[]}
     */
    _this.hunks = [];

    /**
     * The array index associated with this object.
     *
     * @type {Number}
     */
    _this.index = null;

    /**
     * The source file in the diff.
     *
     * @type {String}
     */
    _this.source = null;

    /**
     * The status of this file: added, deleted, modified or renamed.
     *
     * @type {String}
     */
    _this.status = null;

    /**
     * The target file in the diff.
     *
     * @type {String}
     */
    _this.target = null;

    // Separate file into hunks.
    var hunks = _this.raw.split(/^@@+\s/gm).filter(Boolean);

    _this.meta = hunks.shift().split(/\n/);

    // Extract the file meta information.
    for (var i = 0, l = _this.meta.length; i < l; i++) {
      var line = _this.meta[i];
      // Skip null and index values.
      if (/\/dev\/null|^index\s/.test(line)) {
        continue;
      }
      // Source file.
      if (/^---\s/.test(line)) {
        // Remove mnemonic prefixes.
        // @see https://git-scm.com/docs/diff-config (diff.mnemonicPrefix)
        _this.source = line.replace(/^---\s(?:(?:a|b|c|i|o|w|1|2)\/)?/, '');
      }
      // Target file.
      else if (/^\+\+\+\s/.test(line)) {
          // Remove mnemonic prefixes.
          // @see https://git-scm.com/docs/diff-config (diff.mnemonicPrefix)
          _this.target = line.replace(/^\+\+\+\s(?:(?:a|b|c|i|o|w|1|2)\/)?/, '');
        }
    }

    if (!_this.source && _this.target) {
      _this.filename = _this.target;
      _this.status = 'added';
    } else if (_this.source && !_this.target) {
      _this.filename = _this.source;
      _this.status = 'deleted';
    } else if (_this.source && _this.target && _this.source !== _this.target) {
      _this.filename = _this.source + ' -> ' + _this.target;
      _this.status = 'renamed';
    } else if (_this.source === _this.target) {
      _this.filename = _this.target;
      _this.status = 'modified';
    }

    // Determine the extension to associate with the File object.
    _this.extension = _Utility2.default.extension(_this.target ? _this.target : _this.source);

    // Create the Hunk instances.
    for (var _i = 0, _l = hunks.length; _i < _l; _i++) {
      _this.hunks[_i] = new _Hunk2.default(_this, hunks[_i]);
      _this.hunks[_i].index = _i;
      _this.height += _this.hunks[_i].height;
      _this.size += _this.hunks[_i].size;
    }
    return _this;
  }

  /**
   * Retrieves the Patch instance this File belongs to.
   *
   * @return {Patch|Diff}
   *   The Patch instance.
   */


  _createClass(File, [{
    key: 'getPatch',
    value: function getPatch() {
      return this.getParent();
    }

    /**
     * {@inheritDoc}
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'parse',
    value: function parse() {
      var _this2 = this;

      return this.doParse(null, function () {
        return _this2.each(_this2.hunks, function (hunk) {
          return hunk.parse();
        });
      });
    }

    /**
     * {@inheritDoc}
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      return this.doRender('file', function () {
        _this3.renderContainer();
        _this3.header = _Utility2.default.createElement('<div>').addClass('patchr-file-header').appendTo(_this3.container);
        _Utility2.default.createElement('<div>').addClass('patchr-file-info').appendTo(_this3.header).append(_this3.renderDiffStats()).append(_this3.renderStatus()).append(_this3.renderFilename());
        _this3.table = new _Table2.default(_this3.name).appendTo(_this3.container);
        return _this3.each(_this3.hunks, function (hunk) {
          return hunk.render(_this3.table);
        }).then(function () {
          return _this3.container;
        });
      });
    }
  }, {
    key: 'renderPlaceholder',
    value: function renderPlaceholder() {
      var header = _Utility2.default.createElement('<div>').addClass('patchr-file-header');
      _Utility2.default.createElement('<div>').addClass('patchr-file-info').append(this.getPatchrOption('throbber').replace('patchr-throbber', 'patchr-throbber xs in')).append(this.renderStatus()).append(this.renderFilename()).appendTo(header);
      return this.renderContainer().append(header);
    }

    /**
     * Renders the filename.
     *
     * @return {Element|String}
     *   The Element object containing the rendered HTML. Can be cast to
     *   a string value or manually invoked using the toString method.
     */

  }, {
    key: 'renderFilename',
    value: function renderFilename() {
      return _Utility2.default.createElement('<span>').addClass('patchr-filename').text(this.filename);
    }

    /**
     * Determines which abbreviation to use for the status.
     *
     * @return {Element|String}
     *   The Element object containing the rendered HTML. Can be cast to
     *   a string value or manually invoked using the toString method.
     */

  }, {
    key: 'renderStatus',
    value: function renderStatus() {
      var status = '?';
      if (this.status === 'added') {
        status = 'A';
      } else if (this.status === 'deleted') {
        status = 'D';
      } else if (this.status === 'modified') {
        status = 'M';
      } else if (this.status === 'renamed') {
        status = 'R';
      }
      return _Utility2.default.createElement('<span>').text(status).addClass(['patchr-file-status', 'patchr-file-status--' + (this.status ? this.status : 'unknown')]).setAttribute('title', this.status[0].toUpperCase() + this.status.substr(1));
    }
  }]);

  return File;
}(_Renderable3.default);

exports.default = File;

},{"./Hunk":32,"./Patch":36,"./Renderable":39,"./Table":40,"./Utility":43}],32:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _File = require('./File');

var _File2 = _interopRequireDefault(_File);

var _Line = require('./Line');

var _Line2 = _interopRequireDefault(_Line);

var _Renderable2 = require('./Renderable');

var _Renderable3 = _interopRequireDefault(_Renderable2);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Hunk = function (_Renderable) {
  _inherits(Hunk, _Renderable);

  /**
   * @class Hunk
   *
   * @param {File} file
   *   The File instance this Hunk belongs to.
   * @param {String} string
   *   The hunk string.
   *
   * @extends Renderable
   *
   * @constructor
   */
  function Hunk(file, string) {
    _classCallCheck(this, Hunk);

    /**
     * The hunk header, if any.
     *
     * @type {String}
     */
    var _this = _possibleConstructorReturn(this, (Hunk.__proto__ || Object.getPrototypeOf(Hunk)).call(this, 'hunk', string, file, _File2.default));

    _this.header = null;

    _this.height = 26;

    /**
     * An array of Line objects.
     *
     * @type {Line[]}
     */
    _this.lines = [];

    /**
     * The meta information for this hunk.
     *
     * @type {Object}
     */
    _this.meta = null;

    /**
     * The source meta info.
     *
     * @type {{start: Number, total: Number}}
     */
    _this.source = { start: 0, total: 0 };

    /**
     * The target meta info.
     *
     * @type {{start: Number, total: Number}}
     */
    _this.target = { start: 0, total: 0 };

    var lines = string.split(/\n/);
    _this.meta = lines.shift();

    // Filter out completely empty lines, not lines with just whitespace.
    lines = lines.filter(function (line) {
      return line !== '';
    });

    // Create the Line instances.
    for (var i = 0, l = lines.length; i < l; i++) {
      _this.lines[i] = new _Line2.default(_this, lines[i]);
      _this.lines[i].index = i;
      _this.height += _this.lines[i].height;
      _this.size += _this.lines[i].size;
    }
    return _this;
  }

  /**
   * Retrieves the File instance this Hunk belongs to.
   *
   * @return {File|Diff}
   *   The File instance.
   */


  _createClass(Hunk, [{
    key: 'getFile',
    value: function getFile() {
      return this.getParent();
    }

    /**
     * Highlights code in the hunk.
     */

  }, {
    key: 'highlightCode',
    value: function highlightCode() {
      // Join each line value to simulate the hunk in its entirety.
      var string = '';
      for (var i = 0, l = this.lines.length; i < l; i++) {
        string += this.lines[i].value + (i !== l - 1 ? '\n' : '');
      }

      var highlighter = this.getPatchrOption('highlighter');
      var callback = this.getPatchrOption('highlight.callback', _Utility2.default.noop);

      // Highlight the hunk code.
      if (highlighter && _Utility2.default.isFunction(callback)) {
        string = callback.apply(this, [string]) || '';
      }

      // Highlight trailing whitespace.
      if (this.getPatchrOption('highlight.trailingWhitespace')) {
        string = string.replace(/(\t| )+\n/g, '<span class="patchr-trailing-space" title="Trailing whitespace">$1</span>\n');
      }

      // Highlight tabs.
      if (this.getPatchrOption('highlight.tabs')) {
        string = string.replace(/\t/g, '<span class="patchr-tab" title="Tab"></span>');
      }

      // Iterate over the highlighted lines and set the corresponding line value.
      var lines = string.split('\n');
      for (var _i = 0, _l = lines.length; _i < _l; _i++) {
        // Skip "no-new-line".
        if (this.lines[_i].status === 'no-new-line') {
          continue;
        }
        this.lines[_i].value = lines[_i];
      }
    }

    /**
     * {@inheritDoc}
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'parse',
    value: function parse() {
      var _this2 = this;

      return this.doParse('hunk', function () {
        // Extract hunk meta information.
        if (_this2.meta.length) {
          // Extract the "at" separator, and prepend it to the meta information.
          // This was removed from the hunk split in File.
          var at = _this2.meta.match(/\s?(@@+)\s?/);
          _this2.meta = (at && at[1] && at[1] + ' ' || '') + _this2.meta;

          var parts = _this2.meta.split(/\s?@@+\s?/).filter(Boolean);
          if (parts[1]) {
            _this2.header = parts[1];
          }

          var source = void 0;
          var target = void 0;
          var ranges = parts[0].split(' ');
          if (ranges[0][0] === '-') {
            source = ranges[0].substr(1).split(',');
            target = ranges[1].substr(1).split(',');
          } else {
            source = ranges[1].substr(1).split(',');
            target = ranges[0].substr(1).split(',');
          }
          _this2.source.start = parseInt(source[0], 10);
          _this2.source.total = parseInt(source[1] || 0, 10);
          _this2.target.start = parseInt(target[0], 10);
          _this2.target.total = parseInt(target[1] || 0, 10);
        }

        var sourceStart = _this2.source.start;
        var targetStart = _this2.target.start;

        // Parse lines.
        return _this2.each(_this2.lines, function (line) {
          return line.parse().then(function () {
            switch (line.status) {
              case 'added':
                line.lineNumbers.target = targetStart++;
                break;
              case 'deleted':
                line.lineNumbers.source = sourceStart++;
                break;

              default:
                line.lineNumbers.source = sourceStart++;
                line.lineNumbers.target = targetStart++;
                break;
            }
          });
        });
      });
    }

    /**
     * {@inheritDoc}
     *
     * @param {Table} table
     *   The Table element this hunk is being rendered to.
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'render',
    value: function render(table) {
      var _this3 = this;

      return this.doRender('hunk', function () {
        // Just create an empty element to house the rows.
        _this3.rendered = _Utility2.default.createElement();

        if (_this3.meta) {
          var row = table.addRow().setAttributes(_this3.attributes).addClass(['patchr-line', 'patchr-line--hunk']);
          row.addCell().setAttribute('data-line-number', '...').addClass('patchr-line-number');
          row.addCell().setAttribute('data-line-number', '...').addClass('patchr-line-number');
          row.addCell().setAttribute('data-hunk-meta', _this3.meta).addClass('patchr-hunk-meta');
        }

        // Render the lines.
        return _this3.each(_this3.lines, function (line) {
          return line.render(table.addRow());
        }).then(function () {
          return table;
        });
      });
    }
  }]);

  return Hunk;
}(_Renderable3.default);

exports.default = Hunk;

},{"./File":31,"./Line":33,"./Renderable":39,"./Utility":43}],33:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Hunk = require('./Hunk');

var _Hunk2 = _interopRequireDefault(_Hunk);

var _Renderable2 = require('./Renderable');

var _Renderable3 = _interopRequireDefault(_Renderable2);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Line = function (_Renderable) {
  _inherits(Line, _Renderable);

  /**
   * @class Line
   *
   * @param {Hunk} hunk
   *   The Hunk instance that this Line belongs to.
   * @param {String} string
   *   The line of text.
   *
   * @extends Renderable
   *
   * @constructor
   */
  function Line(hunk, string) {
    _classCallCheck(this, Line);

    /**
     * The source and target line numbers.
     *
     * @type {{source: Number, target: Number}}
     */
    var _this = _possibleConstructorReturn(this, (Line.__proto__ || Object.getPrototypeOf(Line)).call(this, 'line', string, hunk, _Hunk2.default));

    _this.lineNumbers = { source: 0, target: 0 };

    _this.height = 20;

    /**
     * The status of the line.
     *
     * @type {String}
     */
    _this.status = null;

    /**
     * The value of the line.
     *
     * @type {String}
     */
    _this.value = string.substr(1);

    // Set the size of the line.
    _this.size = _this.value.length;

    /**
     * The first character of the line, indicating the "status".
     *
     * @type {String}
     */
    _this.symbol = string[0];

    switch (_this.symbol) {
      case '-':
        _this.status = 'deleted';
        break;

      case '+':
        _this.status = 'added';
        break;

      case '\\':
        _this.status = 'no-new-line';
        _this.symbol = '';
        _this.value = _this.value.replace(/^\s*|\s*$/, '');
        break;

      default:
        _this.status = 'context';
    }

    // Increase stats.
    switch (_this.status) {
      case 'added':
        _this.increaseAddition();
        break;

      case 'deleted':
        _this.increaseDeletion();
        break;
    }
    return _this;
  }

  /**
   * Retrieves the Hunk instance this Line belongs to.
   *
   * @return {Hunk|Diff}
   *   The Hunk instance.
   */


  _createClass(Line, [{
    key: 'getHunk',
    value: function getHunk() {
      return this.getParent();
    }

    /**
     * {@inheritDoc}
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'parse',
    value: function parse() {
      var _this2 = this;

      return this.doParse('line', function () {
        _this2.attributes.addClass('patchr-line--' + _this2.status);
      });
    }

    /**
     * {@inheritDoc}
     *
     * @param {TableRow} row
     *   The TableRow instance this line belongs to.
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'render',
    value: function render(row) {
      var _this3 = this;

      return this.doRender('line', function () {
        var file = _this3.getHunk().getFile();
        var id = 'file-' + file.sha1;

        row.setAttributes(_this3.attributes).addClass(['patchr-line', 'patchr-line--' + _this3.status]);

        // Don't show line numbers for "no-new-line" status.
        if (_this3.status !== 'no-new-line') {
          // Source line number.
          var source = row.addCell().addClass('patchr-line-number');
          if (_this3.lineNumbers.source) {
            source.setAttribute('id', id + '-S' + _this3.lineNumbers.source).setAttribute('data-line-number', _this3.lineNumbers.source ? _this3.lineNumbers.source : '');
          }

          // Target line number.
          var target = row.addCell().addClass('patchr-line-number');
          if (_this3.lineNumbers.target) {
            target.setAttribute('id', id + '-T' + _this3.lineNumbers.target).setAttribute('data-line-number', _this3.lineNumbers.target ? _this3.lineNumbers.target : '');
          }
        }

        // Source code.
        var code = row.addCell().addClass('patchr-line-code');

        // Ensure "no-new-line" status spans the line number columns.
        if (_this3.status === 'no-new-line') {
          code.setAttribute('colspan', 3);
        }

        _Utility2.default.createElement('<span class="patchr-line-code-inner"/>').appendTo(code).setAttribute('data-symbol', _this3.symbol).html(_this3.value, true);

        return row;
      });
    }
  }]);

  return Line;
}(_Renderable3.default);

exports.default = Line;

},{"./Hunk":32,"./Renderable":39,"./Utility":43}],34:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Base2 = require('./Base');

var _Base3 = _interopRequireDefault(_Base2);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var LocaleBase = function (_Base) {
  _inherits(LocaleBase, _Base);

  function LocaleBase() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LocaleBase);

    /**
     * The current language code.
     *
     * @type {String}
     */
    var _this = _possibleConstructorReturn(this, (LocaleBase.__proto__ || Object.getPrototypeOf(LocaleBase)).call(this, _Utility2.default.extend(true, {}, LocaleBase.__defaultOptions__, options)));

    _this.langCode = _this.getOption('langCode', 'en-US');

    /**
     * The locale object.
     *
     * @type {Object}
     */
    _this.locale = _this.getOption('locale', {});
    return _this;
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


  _createClass(LocaleBase, [{
    key: 't',
    value: function t(text) {
      var langCode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.langCode;

      if (this.locale[langCode] && this.locale[langCode].hasOwnProperty(text)) {
        return this.locale[langCode][text];
      }
      return text;
    }
  }]);

  return LocaleBase;
}(_Base3.default);

exports.default = LocaleBase;


LocaleBase.__defaultOptions__ = {
  locale: {}
};

},{"./Base":26,"./Utility":43}],35:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});



var _Patchr = require('./Patchr');

var _Patchr2 = _interopRequireDefault(_Patchr);

var _Patch = require('./Patch');

var _Patch2 = _interopRequireDefault(_Patch);

var _Renderable2 = require('./Renderable');

var _Renderable3 = _interopRequireDefault(_Renderable2);

var _Url = require('./Url');

var _Url2 = _interopRequireDefault(_Url);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Parser = function (_Renderable) {
  _inherits(Parser, _Renderable);

  /**
   * @class Parser
   *
   * @param {Patchr} patchr
   *   The Patchr instance.
   * @param {String} string
   *   The diff contents to parse.
   * @param {Url} [url=null]
   *   The Url object associated with the string.
   *
   * @constructor
   */
  function Parser(patchr, string) {
    var url = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, Parser);

    /**
     * An array of Patch objects.
     *
     * @type {Patch[]}
     */
    var _this = _possibleConstructorReturn(this, (Parser.__proto__ || Object.getPrototypeOf(Parser)).call(this, 'parser', string, patchr));

    _this.patches = [];

    /**
     * The Url object that provided the contents of this file, if any.
     *
     * @type {Url}
     */
    _this.url = url && _Url2.default.create(url) || null;

    /**
     * The sanitized string.
     *
     * @type {String}
     */
    _this.sanitized = _this.sanitize(_this.raw);

    // Extract sequential constructed patches created using git-format-patch by
    // splitting the file up based on git's "fixed magic date" header.
    // @see https://git-scm.com/docs/git-format-patch
    var patches = _this.sanitized.split(/^From \b[0-9a-f]{5,40}\b Mon Sep 17 00:00:00 2001/gm).filter(Boolean);

    // Create the Patch instances.
    for (var i = 0, l = patches.length; i < l; i++) {
      _this.patches[i] = new _Patch2.default(_this, patches[i]);
      _this.patches[i].index = i;
      _this.height += _this.patches[i].height;
      _this.size += _this.patches[i].size;
    }
    return _this;
  }

  /**
   * {@inheritDoc}
   *
   * @param {String} [type='default']
   *   The type of garbage collection.
   *
   * @return {Boolean}
   *   True or false.
   */


  _createClass(Parser, [{
    key: 'garbageCollect',
    value: function garbageCollect() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';

      var collect = _get(Parser.prototype.__proto__ || Object.getPrototypeOf(Parser.prototype), 'garbageCollect', this).call(this, type);
      if (collect && type === 'parse') {
        this.sanitized = null;
      }
      return collect;
    }

    /**
     * {@inheritDoc}
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return this.doRender(null, function () {
        _this2.rendered = _Utility2.default.createElement('<div>').setAttributes(_this2.attributes).addClass(['patchr-wrapper', 'patchr-reset']);
        var patches = _Utility2.default.createElement('<div>').addClass('patchr-patches').appendTo(_this2.rendered);
        return _this2.each(_this2.patches, function (patch) {
          return patch.render().then(function (content) {
            return patches.append(content);
          });
        });
      });
    }

    /**
     * Renders a menu for sequential patches from git-format-patch output.
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'renderPatchesMenu',
    value: function renderPatchesMenu() {
      var _this3 = this;

      return this.doRender('patch.menu', function () {
        var menu = _Utility2.default.createElement('<ul>').addClass('patchr-patch-menu').append('<li><strong>Patch</strong></li>');
        if (_this3.patches.length <= 1) {
          return _this3.resolve(menu.disable());
        }
        return _this3.each(_this3.patches, function (patch) {
          return patch.renderMenuItem().then(function (item) {
            return menu.append(item);
          });
        }).then(function () {
          return menu;
        });
      });
    }
  }]);

  return Parser;
}(_Renderable3.default);

exports.default = Parser;

},{"./Patch":36,"./Patchr":37,"./Renderable":39,"./Url":42,"./Utility":43}],36:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _File = require('./File');

var _File2 = _interopRequireDefault(_File);

var _Parser = require('./Parser');

var _Parser2 = _interopRequireDefault(_Parser);

var _Renderable2 = require('./Renderable');

var _Renderable3 = _interopRequireDefault(_Renderable2);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Patch = function (_Renderable) {
  _inherits(Patch, _Renderable);

  /**
   * @class Patch
   *
   * @param {Parser} parser
   *   The Parser object this Patch belongs to.
   * @param {String} string
   *   The contents of a diff file section.
   *
   * @constructor
   */
  function Patch(parser, string) {
    _classCallCheck(this, Patch);

    /**
     * An array of File objects.
     *
     * @type {File[]}
     */
    var _this = _possibleConstructorReturn(this, (Patch.__proto__ || Object.getPrototypeOf(Patch)).call(this, 'patch', string, parser, _Parser2.default));

    _this.files = [];

    /**
     * Meta information for the patch.
     *
     * @type {Object}
     */
    _this.meta = null;

    // Split into separate files, delimited by lines starting with "diff".
    var files = _this.raw.split(/^diff\s[^\n]+\n/gm);

    // Extract any meta information from the first array item.
    var meta = files.shift();

    // Remove any lingering empty array items.
    files = files.filter(Boolean);

    // Parse any meta info (safe to do now since there is only a few at most).
    _this.parseMetaInfo(meta, files);

    // Create the File instances.
    for (var i = 0, l = files.length; i < l; i++) {
      _this.files[i] = new _File2.default(_this, files[i]);
      _this.files[i].index = i;
      _this.height += _this.files[i].height;
      _this.size += _this.files[i].size;
    }
    return _this;
  }

  /**
   * Retrieves the Parser instance this Patch belongs to.
   *
   * @return {Parser|Diff}
   *   The Parser instance.
   */


  _createClass(Patch, [{
    key: 'getParser',
    value: function getParser() {
      return this.getParent();
    }

    /**
     * Parses any supplied meta information from a patch.
     *
     * This is typically only ever provided if a patch was created using
     * git-format-patch.
     *
     * @param {String} info
     *   A string of meta information from a patch.
     * @param {Array} files
     *   The array of raw files.
     */

  }, {
    key: 'parseMetaInfo',
    value: function parseMetaInfo(info, files) {
      if (this.meta) {
        return;
      }
      var meta = {};

      if (info.length) {
        var headers = info.split('\n').filter(Boolean);

        // Determine position of the "first blank line", if any.
        var blank = _Utility2.default.indexOf(headers, '');

        // Determine position of the "scissor", if any.
        var scissor = _Utility2.default.indexOf(headers, '-- >8 --');

        // Join the headers and any subsequent headers from the "body" after the
        // first blank line and/or "scissor" delimiters.
        if (blank !== -1 && scissor !== -1) {
          // If there is no blank line, then just use the headers array length.
          if (blank === -1) {
            blank = headers.length;
          }
          headers = headers.slice(0, blank).concat(headers.slice((scissor !== -1 ? scissor : blank) + 1));
        }

        // Parse any meta information as "email header fields" per RFC 2822.
        // https://tools.ietf.org/html/rfc2822#section-2.2
        var previousKey = void 0;
        for (var i = 0, l = headers.length; i < l; i++) {
          var header = headers[i];
          var parts = header.match(/^([\w\d\-_]+):\s(.*)/);
          var key = parts && parts[1] && _Utility2.default.machineName(parts[1]);
          var value = parts && parts[2];
          if (key && value) {
            // Convert to a date object.
            if (/^date/i.test(key)) {
              value = !isNaN(Date.parse(value)) ? new Date(value) : value;
            }
            // Remove the standard git subject prefix ([PATCH]) if there's
            // just one patch. If there is more than one patch ([PATCH n/n])
            // then keeping this prefix is important for identification.
            else if (/^subject/i.test(key)) {
                value = value.replace(/^\[PATCH]\s/, '');
              }
            meta[key] = value;
            previousKey = key;
          }
          // Parse "Long Header Fields" (lines that start with a single space)
          // and append its value to the previous key.
          else if (previousKey && header.match(/^\s/)) {
              meta[previousKey] += header;
            } else if (!header || header.match(/^---/)) {
              previousKey = null;
            }
        }

        // Finally, extract any signature and remove it from the last file.
        if (files && files.length) {
          var lastFile = files[files.length - 1];
          var signaturePosition = lastFile.search(/^--\s*\n(.|\n)*$/m);
          if (signaturePosition !== -1) {
            meta.signature = lastFile.substr(signaturePosition).replace(/^--\s*\n/, '') || null;
            if (meta.signature) {
              files[files.length - 1] = lastFile.substr(0, signaturePosition);
            }
          }
        }
      }

      this.meta = meta;
    }

    /**
     * {@inheritDoc}
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return this.doRender('patch', function () {
        return _this2.renderContainer().then(function () {
          return _this2.renderMeta();
        }).then(function (meta) {
          return meta.appendTo(_this2.container);
        }).then(function () {
          return _this2.each(_this2.files, function (file) {
            return file.render();
          });
        }).then(function () {
          return _this2.container;
        });
      });
    }

    /**
     * Renders a menu for sequential patches from git-format-patch output.
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'renderMenuItem',
    value: function renderMenuItem() {
      var _this3 = this;

      return this.doRender('patch.menu.item', function () {
        var item = _Utility2.default.createElement('<li>').addClass('patch-item');
        var patch = _this3.index + 1;
        return _Utility2.default.createElement('<a>').setAttribute('href', '#').setAttribute('data-patch', patch).text(patch).appendTo(item);
      });
    }

    /**
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'renderMeta',
    value: function renderMeta() {
      var _this4 = this;

      return this.promise(function (resolve, reject) {
        var meta = _Utility2.default.createElement('<div>').addClass('patchr-patch-meta');
        if (Object.keys(_this4.meta).length) {
          var table = _Utility2.default.createElement('<table>').appendTo(meta);
          var body = _Utility2.default.createElement('<tbody>').appendTo(table);
          for (var p in _this4.meta) {
            if (_this4.meta.hasOwnProperty(p)) {
              var value = _this4.meta[p];
              if (value instanceof Date) {
                var iso = typeof value.toISOString === 'function' ? value.toISOString() : false;
                value = typeof value.toLocaleString === 'function' ? value.toLocaleString() : value.toString();
                if (iso) {
                  value = '<time datetime="' + iso + '">' + value + '</time>';
                }
              }
              _Utility2.default.createElement('<tr><td>' + p + '</td><td>' + value + '</td></tr>').appendTo(body);
            }
          }
        } else {
          meta.disable();
        }
        resolve(meta);
      });
    }
  }]);

  return Patch;
}(_Renderable3.default);

exports.default = Patch;

},{"./File":31,"./Parser":35,"./Renderable":39,"./Utility":43}],37:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});



var _es6Extensions = require('promise/setimmediate/es6-extensions');

var _es6Extensions2 = _interopRequireDefault(_es6Extensions);

require('promise/setimmediate/finally');

var _LocaleBase2 = require('./LocaleBase');

var _LocaleBase3 = _interopRequireDefault(_LocaleBase2);

var _Parser = require('./Parser');

var _Parser2 = _interopRequireDefault(_Parser);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);






require('promise/setimmediate/rejection-tracking').enable({ allRejections: true });

// Local imports.

var Patchr = function (_LocaleBase) {
  _inherits(Patchr, _LocaleBase);

  /**
   * @class Patchr
   *
   * @param {Object} [options]
   *   Any additional options to pass along to the object when instantiating.
   *
   * @constructor
   */
  function Patchr() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Patchr);

    // Ensure there is a valid Promise API available.
    var _this = _possibleConstructorReturn(this, (Patchr.__proto__ || Object.getPrototypeOf(Patchr)).call(this, _Utility2.default.extend(true, {}, Patchr.__defaultOptions__, options)));

    var Promise = _this.getOption('promise');
    if (!(typeof Promise !== 'function' || (typeof Promise === 'undefined' ? 'undefined' : _typeof(Promise)) !== 'object') || typeof (Promise.then || typeof Promise === 'function' && new Promise(_Utility2.default.noop)).then !== 'function') {
      throw new Error('Patchr requires a valid Promise API. There are several polyfills or comprehensive libraries available to choose from.');
    }

    // Bind the highlight method for hunks.
    _this.on('render.hunk.start', function (e, hunk) {
      return hunk.highlightCode();
    });

    // Wrap multi-line comments.
    var highlighter = _this.getOption('highlighter');
    var isPrism = _this.getOption('highlight.isPrism', _Utility2.default.noop);
    if (isPrism(highlighter)) {
      highlighter.hooks.add('wrap', function (env) {
        // eslint-disable-line
        if (env.type === 'comment') {
          var lines = env.content.split(/\n/gm);
          if (lines.length > 1) {
            var attributes = '';
            for (var name in env.attributes) {
              if (env.attributes.hasOwnProperty(name)) {
                attributes += (attributes ? ' ' : '') + name + '="' + (env.attributes[name] || '') + '"';
              }
            }
            for (var i = 0, l = lines.length; i < l; i++) {
              if (i !== 0) {
                lines[i] = '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + lines[i];
              } else if (i !== l) {
                lines[i] += '</' + env.tag + '>';
              }
            }
            env.content = lines.join('\n');
          }
        }
      });
    }

    // Set the "sanitize.encodeHtmlEntities" option based on whether there
    // was a "highlighter" option provided.
    if (_this.getOption('sanitize.encodeHtmlEntities') === null) {
      _this.setOption('sanitize.encodeHtmlEntities', !highlighter);
    }
    return _this;
  }

  /**
   * Retrieves a Parser instances for a string.
   *
   * @param {String} string
   *   The string to use for the parser.
   * @param {Url|String} [url=null]
   *   A URL to associate with the string.
   *
   * @return {Promise}
   *   A promise.
   */


  _createClass(Patchr, [{
    key: 'getParser',
    value: function getParser(string) {
      var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      return this.resolve(new _Parser2.default(this, string, url));
    }

    /**
     * Parses a diff string.
     *
     * @param {String} string
     *   The string to parse.
     * @param {Url|String} [url=null]
     *   A URL to associate with the string.
     *
     * @return {Promise}
     *   A promise.
     */

  }, {
    key: 'parse',
    value: function parse(string) {
      var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      return this.getParser(string, url).then(function (parser) {
        return parser.parse();
      });
    }
  }]);

  return Patchr;
}(_LocaleBase3.default);

/**
 * The version.
 *
 * @type {String}
 */


exports.default = Patchr;
Patchr.__version__ = '0.1.0';

/**
 * The default options for Patchr.
 *
 * @type {Object}
 */
Patchr.__defaultOptions__ = {

  /**
   * Flag indicating whether or not to automatically free up memory resources.
   *
   * Warning: disabling this may cause excessive memory usage. Only disable if
   * you know what you're doing and plan on manually managing it.
   *
   * @type {Boolean}
   */
  garbageCollect: true,

  /**
   * A library function or object used to highlight code on a hunk level.
   *
   * By default, the code is attuned to look for and use PrismJS.
   *
   * @type {PrismJS|Object|Function}
   */
  highlighter: null,

  /**
   * Various options pertaining to highlighting code.
   *
   * @type {Object}
   */
  highlight: {

    /**
     * Helper function to highlight the code found in the diff.
     *
     * Note: This highlight function makes the assumption that the highlighter
     * being used is PrismJS. If you choose to implement a different highlighter,
     * you will likely need to override this function in the options provided to
     * Patchr.
     *
     * @param {String} string
     *   The content to be highlighted.
     *
     * @return {String}
     *   The string that was passed, modified if highlight was successful.
     *
     * @type {Function|false}
     *
     * @this {Hunk}
     */
    callback: function callback(string) {

      /**
       * The highlighter object or function.
       *
       * @type {Function|Object}
       */
      var highlighter = this.getPatchrOption('highlighter');
      var isPrism = this.getPatchrOption('highlight.isPrism', _Utility2.default.noop);

      // See if the highlighter provided is PrismJS by checking the necessary
      // functions and objects inside the passed highlighter.
      if (highlighter && isPrism(highlighter)) {
        // Determine the correct language grammar object to use for Prism.
        var prismLanguage = this.getPatchrOption('highlight.prismLanguage', _Utility2.default.noop);
        var language = prismLanguage.call(this, highlighter) || 'markup';
        var cLike = _Utility2.default.indexOf(['coffeescript', 'css', 'js', 'less', 'php', 'sass', 'scss'], language) !== -1;
        var before = false;
        var after = false;

        // Fix broken context line comments for C-like languages.
        if (cLike) {
          // Remove full comments from the string (for comparison).
          var lines = string.replace(/(^|[^\\])(?:\/\*[\w\W]*?\*\/|\/\/.*)/gm, '').split('\n');
          var commentStart = false;
          var commentEnd = false;
          for (var i = 0, l = lines.length; i < l; i++) {
            if (commentEnd) {
              break;
            }
            commentStart = commentStart || lines[i].match(/\/\*+/);
            commentEnd = lines[i].match(/\*+\//);
          }
          if (!commentStart && commentEnd) {
            before = true;
            string = '/**\n' + string;
          }

          commentStart = false;
          commentEnd = false;
          for (var _i = lines.length - 1; _i >= 0; _i--) {
            if (commentStart) {
              break;
            }
            commentEnd = commentEnd || lines[_i].match(/\/\*+\//);
            commentStart = lines[_i].match(/\/\*+/);
          }
          if (commentStart && !commentEnd) {
            after = true;
            string += '\n*/';
          }
        }

        // Highlight the string.
        string = highlighter.highlight(string, highlighter.languages[language], language);

        // Remove added comments lines.
        if (before) {
          string = string.split('\n').slice(1).join('\n');
        }
        if (after) {
          var _lines = string.split('\n');
          string = _lines.slice(0, _lines.length - 1).join('\n');
        }
      }
      // Otherwise if the highlighter option provided is a function, see if it
      // returns any output.
      else if (_Utility2.default.isFunction(highlighter)) {
          var ret = highlighter.apply(highlighter, string);
          return ret || string;
        }

      return string;
    },


    /**
     * Determines if the provided highlighter object is Prism.
     *
     * @param {Object|Prism} highlighter
     *   The highlighter object.
     *
     * @return {Boolean}
     *   True or false.
     */
    isPrism: function isPrism() {
      var highlighter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getPatchrOption('highlighter');

      return !!(highlighter && _Utility2.default.isFunction(highlighter.highlight) && _Utility2.default.isFunction(highlighter.Token) && _Utility2.default.isPlainObject(highlighter.languages) && _Utility2.default.isPlainObject(highlighter.languages.markup));
    },


    /**
     * A Prism extension -> language map.
     *
     * @type {Object}
     */
    prismExtensionLanguageMap: {
      coffee: ['coffeescript', 'javascript'],
      htaccess: 'apacheconf',
      inc: 'php',
      info: 'ini',
      md: 'markdown',
      yml: 'yaml'
    },

    /**
     * Helper function to retrieve the language grammar object for Prism.
     *
     * @param {Function|Object} Prism
     *   The PrismJS object, if it exists.
     *
     * @return {Object|void}
     *   A grammar object for the language, based on the file extension, if any.
     *
     * @this {Hunk}
     */
    prismLanguage: function prismLanguage(Prism) {
      // Immediately return if an explicit language exists for the file extension.
      if (_Utility2.default.isPlainObject(Prism.languages[this.__parent__.extension])) {
        return this.__parent__.extension;
      }

      /** @type Object */
      var map = this.getPatchrOption('highlight.prismExtensionLanguageMap', {});
      var languages = [].concat(map[this.__parent__.extension] || []);

      // Otherwise, attempt to find the appropriate language based on extension.
      for (var i = 0, l = languages.length; i < l; i++) {
        if (_Utility2.default.isPlainObject(Prism.languages[languages[i]])) {
          return languages[i];
        }
      }
    },


    /**
     * Flag indicating whether tabs should be highlighted.
     *
     * @type {Boolean}
     */
    tabs: true,

    /**
     * Flag indicating whether trailing whitespace should be highlighted.
     *
     * @type {Boolean}
     */
    trailingWhitespace: true

  },

  /**
   * A Promise constructor.
   *
   * @type {Promise}
   */
  promise: _es6Extensions2.default,

  /**
   * Flag indicating whether or not to render to a string.
   *
   * By default, the rendered output of any Patchr object will be an instance
   * of Element. This allows for further manipulation of the elements,
   * in an OO way, before they're ultimately converted into a string.
   *
   * When the object is joined with a string, it will automatically render the
   * Element instance (and its children) into strings using the magic
   * `toString` method.
   *
   * If you have an object or method that does different things based on
   * whether the provided value is a string or an object and you're not seeing
   * any output, then typecast the return value of a Patchr object's render
   * method to a string when passing the value. An example using jQuery:
   *
   * ```js
   *   $('#content').html('' + parser.render());
   * ```
   *
   * If you find that ugly or have absolutely no need for further manipulation
   * of the Element object, you can set this option to `true` to
   * enforce that any render method will always return a string.
   *
   * @type {Boolean}
   */
  renderToString: false,

  /**
   * Sanitization options.
   *
   * @type {Object}
   */
  sanitize: {

    /**
     * Flag indicating whether or not to remove commented lines.
     *
     * Commented lines start with "#" and are likely from an IDE.
     *
     * @type {Boolean}
     */
    comments: true,

    /**
     * Flag indicating whether or not to replace HTML entities.
     *
     * By default, this value is populated based solely on whether or not
     * the "highlighter" was passed a value as most highlighters will encode
     * HTML entities themselves. You can always explicitly set this to `true`
     * or `false` if you are not getting the desired results.
     *
     * @type {Boolean}
     */
    encodeHtmlEntities: null,

    /**
     * Flag indicating whether or not to remove SVN "new file" lines.
     *
     * @type {Boolean}
     */
    svnNewFiles: true

  }

};

},{"./LocaleBase":34,"./Parser":35,"./Utility":43,"promise/setimmediate/es6-extensions":18,"promise/setimmediate/finally":19,"promise/setimmediate/rejection-tracking":20}],38:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Patchr = require('./Patchr');

var _Patchr2 = _interopRequireDefault(_Patchr);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);



var Proxy = function () {

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
  function Proxy(patchr) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Proxy);

    if (!(patchr instanceof _Patchr2.default)) {
      throw new Error('The "patchr" argument must be an instance of Patchr: ' + patchr);
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


  _createClass(Proxy, [{
    key: 'all',
    value: function all(array) {
      // Don't proxy the entire method since "this" needs to be bound correctly.
      var promise = this.getPatchrOption('promise');
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

  }, {
    key: 'doTask',
    value: function doTask(name, callback) {
      var _this = this;

      // Execute callback inside setImmediate so long sub-tasks don't block.
      return this.emit(name + '.start', this).then(function () {
        return callback.call(_this);
      }).then(function (value) {
        return _this.emit(name + '.end', _this).then(function () {
          return value;
        });
      });
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

  }, {
    key: 'each',
    value: function each(array, callback) {
      var _this2 = this;

      array = _Utility2.default.isArray(array) ? array : [array];
      return array.reduce(function (prev, curr, i) {
        return prev.then(function () {
          return callback(curr, i, array);
        });
      }, this.resolve()).then(function () {
        return _this2.resolve(array);
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

  }, {
    key: 'emit',
    value: function emit(type, args) {
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

  }, {
    key: 'garbageCollect',
    value: function garbageCollect() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';

      var collect = !!this.getPatchrOption('garbageCollect');
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

  }, {
    key: 'getPatchrOption',
    value: function getPatchrOption(name) {
      var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

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

  }, {
    key: 'getOption',
    value: function getOption(name) {
      var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

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

  }, {
    key: 'map',
    value: function map(array, callback) {
      var _this3 = this;

      // Convert each item in the object to a promise.
      return this.each(array, function (value, i) {
        array[i] = _this3.resolve(callback.apply(_this3, [value, i, array]));
      }).then(function (array) {
        return _this3.all(array);
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

  }, {
    key: 'off',
    value: function off(type, listener) {
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

  }, {
    key: 'on',
    value: function on(type, listener) {
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

  }, {
    key: 'once',
    value: function once(type, listener) {
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

  }, {
    key: 'promise',
    value: function promise(resolver) {
      // Don't proxy the entire method since "this" needs to be bound correctly.
      var promise = this.getPatchrOption('promise');
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

  }, {
    key: 'proxy',
    value: function proxy(method, args) {
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

  }, {
    key: 'reject',
    value: function reject(value) {
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

  }, {
    key: 'resolve',
    value: function resolve(value) {
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

  }, {
    key: 'sanitize',
    value: function sanitize(string) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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

  }, {
    key: 'setPatchrOption',
    value: function setPatchrOption(name) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

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

  }, {
    key: 'setOption',
    value: function setOption(name) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

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

  }, {
    key: 't',
    value: function t(text) {
      var langCode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.langCode;

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

  }, {
    key: 'typeCheck',
    value: function typeCheck(value, constructor) {
      var promise = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      return this.proxy('typeCheck', arguments);
    }
  }]);

  return Proxy;
}();

exports.default = Proxy;

},{"./Patchr":37,"./Utility":43}],39:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});



var _Attributes = require('./Attributes');

var _Attributes2 = _interopRequireDefault(_Attributes);

var _Diff2 = require('./Diff');

var _Diff3 = _interopRequireDefault(_Diff2);

var _Element = require('./Element');

var _Element2 = _interopRequireDefault(_Element);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Renderable = function (_Diff) {
  _inherits(Renderable, _Diff);

  /**
   * @class Renderable
   *
   * @param {Patchr|Diff} [parent=null]
   *   A parent Diff object this instance belongs to.
   * @param {String} string
   *   The raw diff string.
   * @param {Function<Diff>} [constructor=null]
   *   The constructor class used to ensure that when a parent instance is
   *   passed, it is of a certain type.
   *
   * @extends Diff
   *
   * @constructor
   */
  function Renderable(parent, string) {
    var constructor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, Renderable);

    /**
     * An Attributes object.
     *
     * @type {Attributes}
     */
    var _this = _possibleConstructorReturn(this, (Renderable.__proto__ || Object.getPrototypeOf(Renderable)).call(this, parent, string, constructor));

    _this.attributes = new _Attributes2.default();

    /**
     * The pre-calculated border width of the Renderable instance.
     *
     * @type {{bottom: Number, left: Number, right: Number, top: Number}|Number}
     */
    _this.border = 0;

    /**
     * The containers element.
     *
     * @type {Element}
     */
    _this.container = null;

    /**
     * The pre-computed height of the Renderable instance.
     *
     * @type {Number}
     */
    _this.height = 0;

    /**
     * The pre-computed margin of the Renderable instance.
     *
     * @type {{bottom: Number, left: Number, right: Number, top: Number}|Number}
     */
    _this.margin = 0;

    /**
     * The pre-computed padding of the Renderable instance.
     *
     * @type {{bottom: Number, left: Number, right: Number, top: Number}|Number}
     */
    _this.padding = 0;

    /**
     * An Element object containing the rendered content.
     *
     * @type {Element|String}
     */
    _this.rendered = null;

    /**
     * The pre-computed width of the Renderable instance.
     *
     * @type {Number}
     */
    _this.width = 0;
    return _this;
  }

  /**
   * Creates a promised based render task with start and end emitted events.
   *
   * @param {String} name
   *   The name of the render task. It will be used as the emitted event and
   *   will be prepended with "render" and appended with both a "start" and
   *   "stop" namespace. If no name is provided the emitted event will simply
   *   be "render".
   * @param {Function} callback
   *   The render callback that will be invoked inside the Promise. Once the
   *   render task has ended, the return value of the promise will be the
   *   rendered property on the object.
   *
   * @return {Promise}
   *   A Promise object.
   */


  _createClass(Renderable, [{
    key: 'doRender',
    value: function doRender() {
      var _this2 = this;

      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'rendered';
      var callback = arguments[1];

      if (this.rendered) {
        return this.resolve(this.rendered);
      }
      // Ensure instance is first parsed before attempting to render anything.
      return this.resolve(!this.parsed ? this.parse() : null).then(function () {
        return _this2.doTask(name ? 'render.' + name : 'render', function () {
          return _this2.resolve(callback.call(_this2))
          // Ensure return value is an Element.
          .then(function (element) {
            return _this2.typeCheck(element, _Element2.default);
          })
          // Rethrow any actual errors, otherwise it was just an event that was
          // prevented. Otherwise, just disable the element.
          .catch(function (element) {
            return element instanceof Error ? _this2.reject(element) : element.disable();
          })
          // Cache the element.
          .then(function (element) {
            _this2.rendered = element;
            return element;
          });
        });
      })
      // Cleanup and normalizing of positional objects.
      .finally(function (element) {
        _this2.garbageCollect('render');
        var dimensions = ['border', 'margin', 'padding'];
        for (var i = 0, l = dimensions.length; i < l; i++) {
          _this2[dimensions[i]] = _Utility2.default.normalizeDimension(dimensions[i], _this2[dimensions[i]]);
        }
        return element;
      });
    }

    /**
     * {@inheritDoc}
     *
     * @param {String} [type='default']
     *   The type of garbage collection.
     *
     * @return {Boolean}
     *   True or false.
     */

  }, {
    key: 'garbageCollect',
    value: function garbageCollect() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';

      var collect = _get(Renderable.prototype.__proto__ || Object.getPrototypeOf(Renderable.prototype), 'garbageCollect', this).call(this, type);
      if (collect && type === 'render') {
        this.attributes = null;
      }
      return collect;
    }

    /**
     * Retrieves the pre-computed height for the Renderable instance.
     *
     * Includes padding, border, and optionally margin.
     *
     * @param {Boolean} includeMargin
     *   Flag indicating whether to include margins in the computed value.
     *
     * @return {Number}
     *   A number (without "px") representation of the value.
     */

  }, {
    key: 'outerHeight',
    value: function outerHeight() {
      var includeMargin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var height = this.height;
      this.border = _Utility2.default.normalizeDimension('border', this.border);
      this.padding = _Utility2.default.normalizeDimension('padding', this.padding);
      height += this.border.bottom + this.border.top + this.padding.bottom + this.padding.top;
      if (includeMargin) {
        this.margin = _Utility2.default.normalizeDimension('margin', this.margin);
        height += this.margin.bottom + this.margin.top;
      }
      return height;
    }

    /**
     * Retrieves the pre-computed width for the Renderable instance.
     *
     * Includes padding, border, and optionally margin.
     *
     * @param {Boolean} includeMargin
     *   Flag indicating whether to include margins in the computed value.
     *
     * @return {Number}
     *   A number (without "px") representation of the value.
     */

  }, {
    key: 'outerWidth',
    value: function outerWidth() {
      var includeMargin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var width = this.width;
      this.border = _Utility2.default.normalizeDimension('border', this.border);
      this.padding = _Utility2.default.normalizeDimension('padding', this.padding);
      width += this.border.left + this.border.right + this.padding.left + this.padding.right;
      if (includeMargin) {
        this.margin = _Utility2.default.normalizeDimension('margin', this.margin);
        width += this.margin.left + this.margin.right;
      }
      return width;
    }

    /**
     * Renders the instance.
     *
     * @param {...*} [args]
     *   Any arguments to pass.
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'render',
    value: function render() {
      return this.doRender(null, _Utility2.default.noop);
    }

    /**
     * Renders the container.
     *
     * @param {String} [tag='div']
     *   The name name used to create the container.
     *
     * @return {Element|String}
     *   An element for the container.
     */

  }, {
    key: 'renderContainer',
    value: function renderContainer() {
      var tag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';

      this.container = _Utility2.default.createElement('<' + tag + '>').setAttributes(this.attributes).addClass('patchr-' + this.name);
      return this.container;
    }

    /**
     * Renders a placeholder for the instance.
     *
     * @return {Promise}
     *   A Promise object.
     */

  }, {
    key: 'renderPlaceholder',
    value: function renderPlaceholder() {
      var _this3 = this;

      return this.doRender(this.name + '.placeholder', function () {
        return _this3.renderContainer().addClass('placeholder');
      });
    }
  }]);

  return Renderable;
}(_Diff3.default);

exports.default = Renderable;

},{"./Attributes":25,"./Diff":27,"./Element":28,"./Utility":43}],40:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});



var _Element2 = require('./Element');

var _Element3 = _interopRequireDefault(_Element2);

var _TableRow = require('./TableRow');

var _TableRow2 = _interopRequireDefault(_TableRow);





var Table = function (_Element) {
  _inherits(Table, _Element);

  /**
   * @class Table
   *
   * @param {String} [id=null]
   *   An additional name to use for identifiers.
   * @param {Boolean} [wrapper=true]
   *   Flag indicating whether or not to wrap the table with a <div>.
   *
   * @constructor
   */
  function Table() {
    var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var wrapper = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    _classCallCheck(this, Table);

    var _this = _possibleConstructorReturn(this, (Table.__proto__ || Object.getPrototypeOf(Table)).call(this, wrapper ? 'div' : 'table'));
    // Construct a wrapper for the table, if necessary.


    _this.addClass(wrapper ? 'patchr-table-wrapper' : 'patchr-table');

    /**
     * Flag indicating whether or not to wrap the table with a <div>.
     *
     * @type {Boolean}
     */
    _this.wrapper = wrapper;

    /**
     * The <table> Element.
     *
     * @type {Element}
     */
    _this.table = wrapper ? _Element3.default.create('<table/>').appendTo(_this) : _this;

    /**
     * The <thead> Element.
     *
     * @type {Element}
     */
    _this.header = _Element3.default.create('<thead class="patchr-table-header"/>').appendTo(_this.table);

    /**
     * The <tbody> Element.
     *
     * @type {Element}
     */
    _this.body = _Element3.default.create('<tbody class="patchr-table-body"/>').appendTo(_this.table);

    /**
     * The <tfooter> Element.
     *
     * @type {Element}
     */
    _this.footer = _Element3.default.create('<tfoot class="patchr-table-footer"/>').appendTo(_this.table);

    /**
     * An identifier for the table to use in classes.
     *
     * @type {String}
     */
    _this.id = id;

    if (_this.id) {
      if (wrapper) {
        _this.addClass('patchr-' + _this.id + '-table-wrapper');
      }
      _this.table.addClass('patchr-' + _this.id + '-table');
      _this.header.addClass('patchr-' + _this.id + '-table-header');
      _this.body.addClass('patchr-' + _this.id + '-table-body');
      _this.footer.addClass('patchr-' + _this.id + '-table-footer');
    }
    return _this;
  }

  /**
   * Adds a row to the table.
   *
   * @param {String} [to='body']
   *   Where to add the new row.
   *
   * @return {Element|String}
   *   The row element added.
   */


  _createClass(Table, [{
    key: 'addRow',
    value: function addRow() {
      var to = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'body';

      var row = new _TableRow2.default(this.id, to === 'header' ? 'th' : 'td');
      return row.appendTo(this[to]);
    }

    /**
     * Appends content to the body of the Table element.
     *
     * @param {Element|Object|String} [content=null]
     *   The content to append.
     */

  }, {
    key: 'appendToBody',
    value: function appendToBody() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (content) {
        this.body.append(content);
      }
    }

    /**
     * Appends content to the footer of the Table element.
     *
     * @param {Element|Object|String} [content=null]
     *   The content to append.
     */

  }, {
    key: 'appendToFooter',
    value: function appendToFooter() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (content) {
        this.footer.append(content);
      }
    }

    /**
     * Appends content to the header of the Table element.
     *
     * @param {Element|Object|String} [content=null]
     *   The content to append.
     */

  }, {
    key: 'appendToHeader',
    value: function appendToHeader() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (content) {
        this.header.append(content);
      }
    }

    /**
     * Renders the Table to a string.
     *
     * @param {Boolean} [reset=false]
     *   Resets any already rendered output and forces the element to be
     *   constructed again.
     *
     * @return {String}
     *   The rendered HTML output.
     */

  }, {
    key: 'toString',
    value: function toString() {
      var reset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      // Disable the following elements if they have no children.
      if (!this.body.children.length) {
        this.body.disable();
      }
      if (!this.footer.children.length) {
        this.footer.disable();
      }
      if (!this.header.children.length) {
        this.header.disable();
      }
      return _get(Table.prototype.__proto__ || Object.getPrototypeOf(Table.prototype), 'toString', this).call(this, reset);
    }
  }]);

  return Table;
}(_Element3.default);

exports.default = Table;

},{"./Element":28,"./TableRow":41}],41:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Element2 = require('./Element');

var _Element3 = _interopRequireDefault(_Element2);





var TableRow = function (_Element) {
  _inherits(TableRow, _Element);

  /**
   * @class TableRow
   *
   * @param {String} [id=null]
   *   An additional name to use for identifiers.
   * @param {String} [cellType='td']
   *   The type of cells to create.
   *
   * @constructor
   */
  function TableRow() {
    var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var cellType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'td';

    _classCallCheck(this, TableRow);

    /**
     * The cell type.
     *
     * @type {String}
     */
    var _this = _possibleConstructorReturn(this, (TableRow.__proto__ || Object.getPrototypeOf(TableRow)).call(this, 'tr'));

    _this.cellType = cellType || 'td';

    _this.addClass('patchr-table-row');
    _this.id = id;
    if (_this.id) {
      _this.addClass('patchr-' + _this.id + '-table-row');
    }
    return _this;
  }

  /**
   * Adds a cell to the row.
   *
   * @param {Element|String} [content=null]
   *   The content to use for the cell.
   *
   * @return {Element|String}
   *   The cell element added.
   */


  _createClass(TableRow, [{
    key: 'addCell',
    value: function addCell() {
      var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      var cell = _Element3.default.create('<' + this.cellType + '/>').appendTo(this);
      if (content) {
        cell.html(content);
      }
      return cell;
    }
  }]);

  return TableRow;
}(_Element3.default);

exports.default = TableRow;

},{"./Element":28}],42:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});


var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);





var Url = function (_String) {
  _inherits(Url, _String);

  /**
   * @class Url
   *
   * @param {Url|String|{url: String}} url
   *   The URL for the file. Optionally, an object can be passed instead and
   *   its properties will be merged in.
   *
   * @constructor
   */
  function Url(url) {
    _classCallCheck(this, Url);

    /**
     * The base filename, without the extension.
     *
     * @type {String}
     */
    var _this = _possibleConstructorReturn(this, (Url.__proto__ || Object.getPrototypeOf(Url)).call(this, url));

    _this.basename = null;

    /**
     * The file extensions.
     *
     * @type {String}
     */
    _this.extension = null;

    /**
     * The filename.
     *
     * @type {String}
     */
    _this.filename = null;

    /**
     * The file SHA1 digest based on the value of the URL.
     *
     * @type {Number}
     */
    _this.sha1 = null;

    /**
     * The file size, if known.
     *
     * @type {Number}
     */
    _this.size = 0;

    /**
     * The file mime type, if known.
     *
     * @type {String}
     */
    _this.type = null;

    /**
     * The file URL.
     *
     * @type {String}
     */
    _this.url = typeof url === 'string' && url || null;

    // Merge in any passed object properties.
    if (_Utility2.default.isObject(url)) {
      _Utility2.default.extend(_this, url);
    }

    // Ensure the URL is valid.
    if (!_this.url || !_Utility2.default.isUrl(_this.url)) {
      throw new Error('A Url object must be initialized with a valid "url" property.');
    }

    /**
     * The URL fragment, if any.
     *
     * @type {String}
     */
    _this.fragment = '';

    // Parse the fragment from the URL.
    var fragment = _this.url.search(/#/);
    if (fragment !== -1) {
      _this.fragment = _this.url.substr(fragment + 1);
      _this.url = _this.url.substr(0, fragment);
    }

    /**
     * A query parameter object.
     *
     * @type {Object}
     */
    _this.query = {};

    var query = _this.url.search(/\?/);
    if (query !== -1) {
      _this.query = _this.url.substr(query + 1);
      _this.url = _this.url.substr(0, query);
    }

    // Fill in the defaults.
    _this.extension = _this.extension || _Utility2.default.extension(_this.url);
    _this.basename = _this.basename || _Utility2.default.basename(_this.url, '.' + _this.extension);
    _this.filename = [_this.basename, _this.extension].join('.');
    _this.sha1 = _Utility2.default.sha1(_this.url);

    return _this;
  }

  _createClass(Url, [{
    key: 'toString',
    value: function toString() {
      return this.url + _Utility2.default.param(this.query) + this.fragment;
    }
  }, {
    key: 'valueOf',
    value: function valueOf() {
      return this.toString();
    }
  }]);

  return Url;
}(String);

/**
 * Creates a new Url instance.
 *
 * @param {Url|String|{url: String}} url
 *   The URL for the file. Optionally, an object can be passed instead and
 *   its properties will be merged in.
 *
 * @return {Url}
 *   A new File instance.
 */


exports.default = Url;
Url.create = function create(url) {
  return url instanceof Url ? url : new Url(url);
};

},{"./Utility":43}],43:[function(require,module,exports){
(function (global){
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arrayUniq2 = require('array-uniq');

var _arrayUniq3 = _interopRequireDefault(_arrayUniq2);

var _Element = require('./Element');

var _Element2 = _interopRequireDefault(_Element);

var _nodeQsSerialization = require('node-qs-serialization');

var _extend2 = require('extend');

var _extend3 = _interopRequireDefault(_extend2);

var _htmlParseStringify = require('html-parse-stringify2');

var _htmlParseStringify2 = _interopRequireDefault(_htmlParseStringify);

var _indexof = require('indexof');

var _indexof2 = _interopRequireDefault(_indexof);

var _isFunction2 = require('is-function');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isobject = require('isobject');

var _isobject2 = _interopRequireDefault(_isobject);

var _isPlainObject2 = require('is-plain-object');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isUndefined2 = require('is-undefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _urlRegex = require('url-regex');

var _urlRegex2 = _interopRequireDefault(_urlRegex);


var Utility = {

  /**
   * Ensures that the values in an array are unique.
   *
   * @param {Array} array
   *   The array to iterate over.
   *
   * @return {Array}
   *   An array with unique values.
   */
  arrayUniq: function arrayUniq(array) {
    return (0, _arrayUniq3.default)(array);
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
  basename: function basename(path, suffix) {
    /*eslint-disable*/
    /*! PHP's basename in JavaScript (https://github.com/kvz/locutus/blob/master/src/php/filesystem/basename.js) * Copyright (c) 2007-2016 Kevin van Zonneveld (http://kvz.io) and Contributors (http://locutus.io/authors) * Licensed under MIT (https://github.com/kvz/locutus/blob/master/LICENSE) */
    var b = path;
    var lastChar = b.charAt(b.length - 1);
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
  createElement: function createElement(content) {
    return _Element2.default.create(content);
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
  deparam: function deparam(string) {
    return (0, _nodeQsSerialization.deparam)(string);
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
  encodeHtmlEntities: function encodeHtmlEntities(string) {
    return ('' + string).replace(/[\u00A0-\u9999<>&]/g, function (i) {
      return '&#' + i.charCodeAt(0) + ';';
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
  extend: function extend(deep, obj) {
    return _extend3.default.apply({}, arguments);
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
  extension: function extension(filename) {
    return (/tar\.gz$/.test(filename) ? 'tar.gz' : filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
    );
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
  getProperty: function getProperty(name, object) {
    return name.split('.').reduce(function (a, b) {
      return !(0, _isUndefined3.default)(a[b]) ? a[b] : null;
    }, object);
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
  indexOf: function indexOf(array, value) {
    return (0, _indexof2.default)(array, value);
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
  isArray: function isArray(value) {
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
  isFunction: function isFunction(value) {
    return (0, _isFunction3.default)(value);
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
  isObject: function isObject(value) {
    return (0, _isobject2.default)(value);
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
  isPlainObject: function isPlainObject(value) {
    return (0, _isPlainObject3.default)(value);
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
  isSha1: function isSha1(string) {
    return (/^[0-9a-f]{5,40}$/.test(string)
    );
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
  isType: function isType(value, constructor) {
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
  isUndefined: function isUndefined(value) {
    return (0, _isUndefined3.default)(value);
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
  isUrl: function isUrl(string) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { exact: true };

    // Immediately return false if there is more than one line in the string.
    return string.search(/(\n|\r\n|\r)/gm) !== -1 ? false : (0, _urlRegex2.default)(options).test(string);
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
  machineName: function machineName(string) {
    return string.replace(/([A-Z]+[^A-Z]+)/g, '_$1').toLowerCase().replace(/[^a-z0-9-]+/g, '_').replace(/_+/g, '_').replace(/(^_|_$)/g, '');
  },


  /**
   * An empty function.
   *
   * @type {Function}
   */
  noop: function noop() {},


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
  normalizeDimension: function normalizeDimension(dimension, value) {
    var allowed = ['border', 'margin', 'padding'];
    if ((0, _indexof2.default)(allowed, dimension) === -1) {
      throw new TypeError('Unknown dimension: ' + dimension + '. Only the following dimensions are allowed: ' + allowed.join(', '));
    }
    var defaultValues = function defaultValues() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      return {
        bottom: value,
        left: value,
        right: value,
        top: value
      };
    };
    if (typeof value === 'number') {
      value = defaultValues(value);
    } else if ((0, _isPlainObject3.default)(value)) {
      value = (0, _extend3.default)({}, defaultValues(), value);
    } else {
      throw new TypeError('The "' + dimension + '" dimension provided must be a Number or a plain object.');
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
  param: function param(object) {
    return (0, _nodeQsSerialization.param)(object);
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
  parseHtml: function parseHtml(html) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { ignoreWhitespace: false };

    return _htmlParseStringify2.default.parse(html, options);
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
  sanitizeClasses: function sanitizeClasses() {
    var sanitized = [];

    for (var _len = arguments.length, classes = Array(_len), _key = 0; _key < _len; _key++) {
      classes[_key] = arguments[_key];
    }

    for (var i = 0, l = classes.length; i < l; i++) {
      var values = classes[i] instanceof Array && classes[i] || typeof classes[i] === 'string' && classes[i].split(' ') || [];
      if (values.length) {
        for (var _i = 0, _l = values.length; _i < _l; _i++) {
          sanitized.push(values[_i]);
        }
      }
    }
    return (0, _arrayUniq3.default)(sanitized);
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
  sha1: function sha1(str) {
    /*eslint-disable*/
    /*! PHP's sha1 in JavaScript (https://github.com/kvz/locutus/blob/master/src/php/strings/sha1.js) * Copyright (c) 2007-2016 Kevin van Zonneveld (http://kvz.io) and Contributors (http://locutus.io/authors) Licensed under MIT (https://github.com/kvz/locutus/blob/master/LICENSE) */
    var _rotLeft = function _rotLeft(n, s) {
      var t4 = n << s | n >>> 32 - s;
      return t4;
    };
    var _cvtHex = function _cvtHex(val) {
      var str = '',
          i = void 0,
          v = void 0;
      for (i = 7; i >= 0; i--) {
        v = val >>> i * 4 & 0x0f;
        str += v.toString(16);
      }
      return str;
    };
    var blockstart = void 0,
        i = void 0,
        j = void 0,
        A = void 0,
        B = void 0,
        C = void 0,
        D = void 0,
        E = void 0,
        temp = void 0;
    var W = new Array(80),
        H0 = 0x67452301,
        H1 = 0xEFCDAB89,
        H2 = 0x98BADCFE,
        H3 = 0x10325476,
        H4 = 0xC3D2E1F0;
    str = unescape(encodeURIComponent(str));
    var strLen = str.length;
    var wordArray = [];
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
    while (wordArray.length % 16 !== 14) {
      wordArray.push(0);
    }
    wordArray.push(strLen >>> 29);
    wordArray.push(strLen << 3 & 0x0ffffffff);
    for (blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
      for (i = 0; i < 16; i++) {
        W[i] = wordArray[blockstart + i];
      }
      for (i = 16; i <= 79; i++) {
        W[i] = _rotLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
      }
      A = H0;
      B = H1;
      C = H2;
      D = H3;
      E = H4;
      for (i = 0; i <= 19; i++) {
        temp = _rotLeft(A, 5) + (B & C | ~B & D) + E + W[i] + 0x5A827999 & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      for (i = 20; i <= 39; i++) {
        temp = _rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1 & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      for (i = 40; i <= 59; i++) {
        temp = _rotLeft(A, 5) + (B & C | B & D | C & D) + E + W[i] + 0x8F1BBCDC & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      for (i = 60; i <= 79; i++) {
        temp = _rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6 & 0x0ffffffff;
        E = D;
        D = C;
        C = _rotLeft(B, 30);
        B = A;
        A = temp;
      }
      H0 = H0 + A & 0x0ffffffff;
      H1 = H1 + B & 0x0ffffffff;
      H2 = H2 + C & 0x0ffffffff;
      H3 = H3 + D & 0x0ffffffff;
      H4 = H4 + E & 0x0ffffffff;
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
  template: function template(_template) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var remove = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    return _template.replace(/[{][{] ([\w._-]+) [}][}]/gmi, function (token, name) {
      var value = Utility.getProperty(name, data);
      if (value !== null) {
        return value;
      }
      return remove ? '' : token;
    });
  },
  tick: function tick(callback) {
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
  typeCheck: function typeCheck(value, constructor) {
    var throwError = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    var error = void 0;
    var original = constructor;

    if (!error && !Utility.isFunction(constructor)) {
      error = new SyntaxError('The "constructor" passed must be a function: ' + constructor);
    } else if (!error && !(value instanceof constructor)) {
      error = new TypeError('The value passed must be an instance of ' + (typeof original === 'string' ? original : original.name) + '.');
    }

    if (error && throwError) {
      throw error;
    }

    return !error;
  }
};

exports.default = Utility;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Element":28,"array-uniq":1,"extend":2,"html-parse-stringify2":3,"indexof":7,"is-function":9,"is-plain-object":10,"is-undefined":11,"isobject":12,"node-qs-serialization":13,"url-regex":23}],44:[function(require,module,exports){
require('setimmediate');

var _Attributes = require('./Attributes');

var _Attributes2 = _interopRequireDefault(_Attributes);

var _Base = require('./Base');

var _Base2 = _interopRequireDefault(_Base);

var _Diff = require('./Diff');

var _Diff2 = _interopRequireDefault(_Diff);

var _Element = require('./Element');

var _Element2 = _interopRequireDefault(_Element);

var _Emitter = require('./Emitter');

var _Emitter2 = _interopRequireDefault(_Emitter);

var _Event = require('./Event');

var _Event2 = _interopRequireDefault(_Event);

var _File = require('./File');

var _File2 = _interopRequireDefault(_File);

var _Hunk = require('./Hunk');

var _Hunk2 = _interopRequireDefault(_Hunk);

var _Line = require('./Line');

var _Line2 = _interopRequireDefault(_Line);

var _LocaleBase = require('./LocaleBase');

var _LocaleBase2 = _interopRequireDefault(_LocaleBase);

var _Parser = require('./Parser');

var _Parser2 = _interopRequireDefault(_Parser);

var _Patch = require('./Patch');

var _Patch2 = _interopRequireDefault(_Patch);

var _Patchr = require('./Patchr');

var _Patchr2 = _interopRequireDefault(_Patchr);

var _Proxy = require('./Proxy');

var _Proxy2 = _interopRequireDefault(_Proxy);

var _Renderable = require('./Renderable');

var _Renderable2 = _interopRequireDefault(_Renderable);

var _Url = require('./Url');

var _Url2 = _interopRequireDefault(_Url);

var _Utility = require('./Utility');

var _Utility2 = _interopRequireDefault(_Utility);


module.exports = function (options) {
  return new _Patchr2.default(options);
};

module.exports.__version__ = _Patchr2.default.__version__;
module.exports.__defaultOptions__ = _Patchr2.default.__defaultOptions__;
module.exports.Attributes = _Attributes2.default;
module.exports.Base = _Base2.default;
module.exports.Diff = _Diff2.default;
module.exports.Element = _Element2.default;
module.exports.Emitter = _Emitter2.default;
module.exports.Event = _Event2.default;
module.exports.File = _File2.default;
module.exports.Hunk = _Hunk2.default;
module.exports.Line = _Line2.default;
module.exports.LocaleBase = _LocaleBase2.default;
module.exports.Parser = _Parser2.default;
module.exports.Patch = _Patch2.default;
module.exports.Patchr = _Patchr2.default;
module.exports.Proxy = _Proxy2.default;
module.exports.Renderable = _Renderable2.default;
module.exports.Url = _Url2.default;
module.exports.Utility = _Utility2.default;

},{"./Attributes":25,"./Base":26,"./Diff":27,"./Element":28,"./Emitter":29,"./Event":30,"./File":31,"./Hunk":32,"./Line":33,"./LocaleBase":34,"./Parser":35,"./Patch":36,"./Patchr":37,"./Proxy":38,"./Renderable":39,"./Url":42,"./Utility":43,"setimmediate":21}]},{},[44])(44)
});
