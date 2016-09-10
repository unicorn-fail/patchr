import Patchr from './Patchr';
import Proxy from './Proxy';
import _ from './Utility';

export default class Diff extends Proxy {

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
  constructor(name, string, parent = null, constructor = null) {
    let patchr;
    if (_.isType(parent, Patchr)) {
      patchr = parent;
      parent = null;
    }
    else if (_.isType(parent, Diff)) {
      patchr = parent.patchr;
    }
    else {
      throw new Error(`The "parent" argument passed must be an instance of either Patchr or Diff: ${parent}`);
    }
    super(patchr);

    if (typeof string !== 'string') {
      throw new Error(`The "string" argument passed must be a string: ${string}`);
    }

    if (constructor) {
      _.typeCheck(parent, constructor);
    }

    /**
     * The parent Diff object this instance belongs to.
     *
     * Define this property so that it cannot be overridden or show up in
     * enumerations. It is meant solely for referencing purposes only.
     *
     * @type {Diff}
     */
    Object.defineProperty(this, '__parent__', {
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
    this.additions = 0;

    /**
     * The number of deletions.
     *
     * @type {Number}
     */
    this.deletions = 0;

    /**
     * The array index associated with this object.
     *
     * @type {Number}
     */
    this.index = null;

    /**
     * The machine name representation of the object.
     *
     * @type {String}
     */
    this.name = name;

    /**
     * Flag indicating whether or not the instance has been parsed.
     *
     * @type {Boolean}
     */
    this.parsed = false;

    /**
     * The un-altered string that was passed.
     *
     * @type {String}
     */
    this.raw = string;

    /**
     * The un-altered byte size of the string that was passed.
     *
     * @type {Number}
     */
    this.rawSize = string.length;

    /**
     * The SHA1 digest of the raw string.
     *
     * @type {String}
     */
    this.sha1 = null;

    /**
     * The patch byte size, minute any meta information.
     *
     * @type {Number}
     */
    this.size = 0;
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
  doParse(name, callback) {
    if (this.parsed) {
      return this.resolve(this);
    }
    return this
      .doTask(name ? `parse.${name}` : 'parse', callback)
      .then(() => {
        // To prevent potentially lengthy SHA1 execution time on large strings,
        // attempt to just use the name and index as the "identifier". Fallback
        // to the raw string value otherwise.
        this.sha1 = _.sha1(this.index !== null ? `${this.name}-${this.index}` : this.raw);
        this.parsed = true;
        return this.resolve(this);
      })
      .finally((value) => {
        this.garbageCollect('parse');
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
  garbageCollect(type = 'default') {
    let collect = super.garbageCollect(type);
    if (collect) {
      if (type === 'parse') {
        this.raw = null;
      }
      else if (type === 'render') {
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
  getParent() {
    return this.__parent__ instanceof Diff && this.__parent__ || null;
  }

  /**
   * Increases the addition stat.
   *
   * @param {Boolean} [bubble=true]
   *   Flag determining whether or not the addition should propagate upwards
   *   on parent instances.
   */
  increaseAddition(bubble = true) {
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
  increaseDeletion(bubble = true) {
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
  parse() {
    return this.doParse(this.name, _.noop);
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
  renderDiffStats(object = this) {
    if (!(object instanceof Diff)) {
      throw new Error(`The "object" argument passed is not an instance of Diff: ${object}`);
    }
    return _.createElement('<span>').addClass('patchr-stat')
      .append(`<span class="patchr-stat-additions" title="${object.additions} additions">+${object.additions}</span>`)
      .append(`<span class="patchr-stat-deletions" title="${object.deletions} deletions">-${object.deletions}</span>`);
  }

}
