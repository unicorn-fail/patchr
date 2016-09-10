import _ from './Utility';

export default class Url extends String {

  /**
   * @class Url
   *
   * @param {Url|String|{url: String}} url
   *   The URL for the file. Optionally, an object can be passed instead and
   *   its properties will be merged in.
   *
   * @constructor
   */
  constructor(url) {
    super(url);

    /**
     * The base filename, without the extension.
     *
     * @type {String}
     */
    this.basename = null;

    /**
     * The file extensions.
     *
     * @type {String}
     */
    this.extension = null;

    /**
     * The filename.
     *
     * @type {String}
     */
    this.filename = null;

    /**
     * The file SHA1 digest based on the value of the URL.
     *
     * @type {Number}
     */
    this.sha1 = null;

    /**
     * The file size, if known.
     *
     * @type {Number}
     */
    this.size = 0;

    /**
     * The file mime type, if known.
     *
     * @type {String}
     */
    this.type = null;

    /**
     * The file URL.
     *
     * @type {String}
     */
    this.url = typeof url === 'string' && url || null;

    // Merge in any passed object properties.
    if (_.isObject(url)) {
      _.extend(this, url);
    }

    // Ensure the URL is valid.
    if (!this.url || !_.isUrl(this.url)) {
      throw new Error('A Url object must be initialized with a valid "url" property.');
    }

    /**
     * The URL fragment, if any.
     *
     * @type {String}
     */
    this.fragment = '';

    // Parse the fragment from the URL.
    let fragment = this.url.search(/#/);
    if (fragment !== -1) {
      this.fragment = this.url.substr(fragment + 1);
      this.url = this.url.substr(0, fragment);
    }

    /**
     * A query parameter object.
     *
     * @type {Object}
     */
    this.query = {};

    let query = this.url.search(/\?/);
    if (query !== -1) {
      this.query = this.url.substr(query + 1);
      this.url = this.url.substr(0, query);
    }

    // Fill in the defaults.
    this.extension = this.extension || _.extension(this.url);
    this.basename = this.basename || _.basename(this.url, '.' + this.extension);
    this.filename = [this.basename, this.extension].join('.');
    this.sha1 = _.sha1(this.url);

  }

  toString() {
    return this.url + _.param(this.query) + this.fragment;
  }

  valueOf() {
    return this.toString();
  }

}

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
Url.create = function create(url) {
  return url instanceof Url ? url : new Url(url);
};
