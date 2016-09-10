// Global imports.
import voidElements from 'void-elements';

// Local imports.
import Attributes from './Attributes';
import _ from './Utility';

export default class Element {

  /**
   * @class Element
   *
   * @param {String|Object} [tag=null]
   *   The element tag name or an AST object from html-parse-stringify2.
   *
   * @constructor
   */
  constructor(tag = null) {
    let ast = _.isObject(tag) ? tag : {
      type: 'tag',
      name: tag,
      voidElement: !!voidElements[tag],
      attrs: {},
      children: []
    };

    if (ast.type === 'tag' && typeof ast.name !== 'string') {
      throw new Error(`You must pass a string tag name when creating a tag element: ${ast.name}`);
    }

    /**
     * The Attributes object for this instance.
     *
     * @type {Attributes}
     */
    this.attributes = new Attributes(ast.attrs);

    /**
     * The child Element objects, if any.
     *
     * @type {Array}
     */
    this.children = [];

    // Create necessary child elements.
    if (ast.type === 'tag') {
      for (let i = 0, l = ast.children.length; i < l; i++) {
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
  addClass(value) {
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
  append(content = null, raw = false) {
    let elements = raw ? new Element({
      type: 'text',
      content: content.toString()
    }) : Element.create(content);
    if (elements instanceof Array) {
      for (let i = 0, l = elements.length; i < l; i++) {
        this.children.push(elements[i]);
      }
    }
    else if (elements instanceof Element) {
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
  appendTo(element) {
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
  clone() {
    let clone = new Element(this.name).setAttributes(this.attributes.getData());
    if (this.content) {
      clone.content = this.content;
    }
    for (let i = 0, l = this.children.length; i < l; i++) {
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
  disable() {
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
  enable() {
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
  getAttribute(name, defaultValue) {
    return this.attributes.get.apply(this.attributes, arguments);
  }

  /**
   * Retrieves classes from the element's Attributes object.
   *
   * @return {Array}
   *   The classes array.
   */
  getClasses() {
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
  hasAttribute(name) {
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
  hasClass(className) {
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
  html(content = null, raw = false) {
    // If any argument was provided, then it's in "set" mode.
    if (!_.isUndefined(content)) {
      // Clear out any children or content.
      this.children = [];
      this.content = null;
      // Only set the content if there's content.
      if (content) {
        this.append(content, raw);
      }
      return this;
    }
    else {
      let output = '';
      for (let i = 0, l = this.children; i < l; i++) {
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
  prepend(content = null, raw = false) {
    let elements = raw ? new Element({
      type: 'text',
      content: content.toString()
    }) : Element.create(content);
    if (elements instanceof Array) {
      for (let l = elements.length; l > 0; l--) {
        this.children.unshift(elements[l]);
      }
    }
    else if (elements instanceof Element) {
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
  prependTo(element) {
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
  removeAttribute(name) {
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
  removeClass(value) {
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
  replaceClass(oldValue, newValue) {
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
  setAttribute(name, value) {
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
  setAttributes(attributes) {
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
  text(string) {
    if (!_.isUndefined(string)) {
      this.children = [new Element({
        type: 'text',
        content: _.encodeHtmlEntities(string + '')
      })];
      return this;
    }
    else {
      let text = this.type === 'text' && this.content || '';
      for (let i = 0, l = this.children.length; i < l; i++) {
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
  toString(reset = false) {
    // Immediately return with the rendered output if set.
    if (!reset && this.rendered !== null) {
      return this.enabled ? this.rendered : '';
    }
    this.rendered = '';
    if (this.type === 'text' && this.content) {
      this.rendered += this.content;
    }
    else if (this.type === 'tag' && this.name) {
      // To ensure backwards XHTML compatibility, add a "self-closing" forward
      // slash for void elements. HTML5 ignores these anyway.
      this.rendered += `<${this.name}${this.attributes}${this.voidElement ? ' /' : ''}>`;

      // Only render children and close tag if this isn't a void element.
      if (this.name && !this.voidElement) {
        // Render any value or children.
        for (let i = 0, l = this.children.length; i < l; i++) {
          this.rendered += this.children[i].toString(reset);
        }
        this.rendered += `</${this.name}>`;
      }
    }
    return this.enabled ? this.rendered : '';
  }

}

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
Element.create = function create(content = '') {
  // Immediately return if content is already an Element instance.
  if (content instanceof Element) {
    return content;
  }
  let elements = [];
  let ast = _.parseHtml(content);
  for (let i = 0, l = ast.length; i < l; i++) {
    elements[i] = new Element(ast[i]);
  }
  return elements.length === 1 ? elements[0] : elements;
};
