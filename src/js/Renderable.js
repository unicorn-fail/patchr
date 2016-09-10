import Attributes from './Attributes';
import Diff from './Diff';
import Element from './Element';
import _ from './Utility';

export default class Renderable extends Diff {

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
  constructor(parent, string, constructor = null) {
    super(parent, string, constructor);

    /**
     * An Attributes object.
     *
     * @type {Attributes}
     */
    this.attributes = new Attributes();

    /**
     * The pre-calculated border width of the Renderable instance.
     *
     * @type {{bottom: Number, left: Number, right: Number, top: Number}|Number}
     */
    this.border = 0;

    /**
     * The containers element.
     *
     * @type {Element}
     */
    this.container = null;

    /**
     * The pre-computed height of the Renderable instance.
     *
     * @type {Number}
     */
    this.height = 0;

    /**
     * The pre-computed margin of the Renderable instance.
     *
     * @type {{bottom: Number, left: Number, right: Number, top: Number}|Number}
     */
    this.margin = 0;

    /**
     * The pre-computed padding of the Renderable instance.
     *
     * @type {{bottom: Number, left: Number, right: Number, top: Number}|Number}
     */
    this.padding = 0;

    /**
     * An Element object containing the rendered content.
     *
     * @type {Element|String}
     */
    this.rendered = null;

    /**
     * The pre-computed width of the Renderable instance.
     *
     * @type {Number}
     */
    this.width = 0;
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
  doRender(name = 'rendered', callback) {
    if (this.rendered) {
      return this.resolve(this.rendered);
    }
    // Ensure instance is first parsed before attempting to render anything.
    return this.resolve(!this.parsed ? this.parse() : null)
      .then(() => this.doTask(name ? `render.${name}` : 'render', () => {
        return this.resolve(callback.call(this))
        // Ensure return value is an Element.
          .then(element => this.typeCheck(element, Element))
          // Rethrow any actual errors, otherwise it was just an event that was
          // prevented. Otherwise, just disable the element.
          .catch(element => element instanceof Error ? this.reject(element) : element.disable())
          // Cache the element.
          .then(element => {
            this.rendered = element;
            return element;
          });
      }))
      // Cleanup and normalizing of positional objects.
      .finally(element => {
        this.garbageCollect('render');
        let dimensions = ['border', 'margin', 'padding'];
        for (let i = 0, l = dimensions.length; i < l; i++) {
          this[dimensions[i]] = _.normalizeDimension(dimensions[i], this[dimensions[i]]);
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
  garbageCollect(type = 'default') {
    let collect = super.garbageCollect(type);
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
  outerHeight(includeMargin = false) {
    let height = this.height;
    this.border = _.normalizeDimension('border', this.border);
    this.padding = _.normalizeDimension('padding', this.padding);
    height += this.border.bottom + this.border.top + this.padding.bottom + this.padding.top;
    if (includeMargin) {
      this.margin = _.normalizeDimension('margin', this.margin);
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
  outerWidth(includeMargin = false) {
    let width = this.width;
    this.border = _.normalizeDimension('border', this.border);
    this.padding = _.normalizeDimension('padding', this.padding);
    width += this.border.left + this.border.right + this.padding.left + this.padding.right;
    if (includeMargin) {
      this.margin = _.normalizeDimension('margin', this.margin);
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
  render() {
    return this.doRender(null, _.noop);
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
  renderContainer(tag = 'div') {
    this.container = _.createElement(`<${tag}>`).setAttributes(this.attributes).addClass(`patchr-${this.name}`);
    return this.container;
  }

  /**
   * Renders a placeholder for the instance.
   *
   * @return {Promise}
   *   A Promise object.
   */
  renderPlaceholder() {
    return this.doRender(`${this.name}.placeholder`, () => this.renderContainer().addClass('placeholder'));
  }

}
