// Global imports.
import Promise from 'promise/setimmediate/es6-extensions';
import 'promise/setimmediate/finally';
require('promise/setimmediate/rejection-tracking').enable({allRejections: true});

// Local imports.
import LocaleBase from './LocaleBase';
import Parser from './Parser';
import _ from './Utility';

export default class Patchr extends LocaleBase {

  /**
   * @class Patchr
   *
   * @param {Object} [options]
   *   Any additional options to pass along to the object when instantiating.
   *
   * @constructor
   */
  constructor(options = {}) {
    super(_.extend(true, {}, Patchr.__defaultOptions__, options));

    // Ensure there is a valid Promise API available.
    let Promise = this.getOption('promise');
    if (!(typeof Promise !== 'function' || typeof Promise !== 'object') || typeof (Promise.then || (typeof Promise === 'function' && new Promise(_.noop))).then !== 'function') {
      throw new Error('Patchr requires a valid Promise API. There are several polyfills or comprehensive libraries available to choose from.');
    }

    // Bind the highlight method for hunks.
    this.on('render.hunk.start', (e, hunk) => hunk.highlightCode());

    // Wrap multi-line comments.
    let highlighter = this.getOption('highlighter');
    let isPrism = this.getOption('highlight.isPrism', _.noop);
    if (isPrism(highlighter)) {
      highlighter.hooks.add('wrap', function (env) { // eslint-disable-line
        if (env.type === 'comment') {
          let lines = env.content.split(/\n/gm);
          if (lines.length > 1) {
            let attributes = '';
            for (let name in env.attributes) {
              if (env.attributes.hasOwnProperty(name)) {
                attributes += (attributes ? ' ' : '') + name + '="' + (env.attributes[name] || '') + '"';
              }
            }
            for (let i = 0, l = lines.length; i < l; i++) {
              if (i !== 0) {
                lines[i] = '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + lines[i];
              }
              else if (i !== l) {
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
    if (this.getOption('sanitize.encodeHtmlEntities') === null) {
      this.setOption('sanitize.encodeHtmlEntities', !highlighter);
    }
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
  getParser(string, url = null) {
    return this.resolve(new Parser(this, string, url));
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
  parse(string, url = null) {
    return this.getParser(string, url)
      .then((parser) => parser.parse());
  }

}

/**
 * The version.
 *
 * @type {String}
 */
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
    callback(string) {

      /**
       * The highlighter object or function.
       *
       * @type {Function|Object}
       */
      let highlighter = this.getPatchrOption('highlighter');
      let isPrism = this.getPatchrOption('highlight.isPrism', _.noop);

      // See if the highlighter provided is PrismJS by checking the necessary
      // functions and objects inside the passed highlighter.
      if (highlighter && isPrism(highlighter)) {
        // Determine the correct language grammar object to use for Prism.
        let prismLanguage = this.getPatchrOption('highlight.prismLanguage', _.noop);
        let language = prismLanguage.call(this, highlighter) || 'markup';
        let cLike = _.indexOf(['coffeescript', 'css', 'js', 'less', 'php', 'sass', 'scss'], language) !== -1;
        let before = false;
        let after = false;

        // Fix broken context line comments for C-like languages.
        if (cLike) {
          // Remove full comments from the string (for comparison).
          let lines = string.replace(/(^|[^\\])(?:\/\*[\w\W]*?\*\/|\/\/.*)/gm, '').split('\n');
          let commentStart = false;
          let commentEnd = false;
          for (let i = 0, l = lines.length; i < l; i++) {
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
          for (let i = lines.length - 1; i >= 0; i--) {
            if (commentStart) {
              break;
            }
            commentEnd = commentEnd || lines[i].match(/\/\*+\//);
            commentStart = lines[i].match(/\/\*+/);
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
          let lines = string.split('\n');
          string = lines.slice(0, lines.length - 1).join('\n');
        }
      }
      // Otherwise if the highlighter option provided is a function, see if it
      // returns any output.
      else if (_.isFunction(highlighter)) {
        let ret = highlighter.apply(highlighter, string);
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
    isPrism(highlighter = this.getPatchrOption('highlighter')) {
      return !!(highlighter && _.isFunction(highlighter.highlight) && _.isFunction(highlighter.Token) && _.isPlainObject(highlighter.languages) && _.isPlainObject(highlighter.languages.markup));
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
    prismLanguage(Prism) {
      // Immediately return if an explicit language exists for the file extension.
      if (_.isPlainObject(Prism.languages[this.__parent__.extension])) {
        return this.__parent__.extension;
      }

      /** @type Object */
      let map = this.getPatchrOption('highlight.prismExtensionLanguageMap', {});
      let languages = [].concat(map[this.__parent__.extension] || []);

      // Otherwise, attempt to find the appropriate language based on extension.
      for (let i = 0, l = languages.length; i < l; i++) {
        if (_.isPlainObject(Prism.languages[languages[i]])) {
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
  promise: Promise,

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
