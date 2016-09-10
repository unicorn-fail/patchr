import Element from './Element';
import TableRow from './TableRow';

export default class Table extends Element {

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
  constructor(id = null, wrapper = true) {
    // Construct a wrapper for the table, if necessary.
    super(wrapper ? 'div' : 'table');
    this.addClass(wrapper ? 'patchr-table-wrapper' : 'patchr-table');

    /**
     * Flag indicating whether or not to wrap the table with a <div>.
     *
     * @type {Boolean}
     */
    this.wrapper = wrapper;

    /**
     * The <table> Element.
     *
     * @type {Element}
     */
    this.table = wrapper ? Element.create('<table/>').appendTo(this) : this;

    /**
     * The <thead> Element.
     *
     * @type {Element}
     */
    this.header = Element.create('<thead class="patchr-table-header"/>').appendTo(this.table);

    /**
     * The <tbody> Element.
     *
     * @type {Element}
     */
    this.body = Element.create('<tbody class="patchr-table-body"/>').appendTo(this.table);

    /**
     * The <tfooter> Element.
     *
     * @type {Element}
     */
    this.footer = Element.create('<tfoot class="patchr-table-footer"/>').appendTo(this.table);

    /**
     * An identifier for the table to use in classes.
     *
     * @type {String}
     */
    this.id = id;

    if (this.id) {
      if (wrapper) {
        this.addClass(`patchr-${this.id}-table-wrapper`);
      }
      this.table.addClass(`patchr-${this.id}-table`);
      this.header.addClass(`patchr-${this.id}-table-header`);
      this.body.addClass(`patchr-${this.id}-table-body`);
      this.footer.addClass(`patchr-${this.id}-table-footer`);
    }
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
  addRow(to = 'body') {
    let row = new TableRow(this.id, to === 'header' ? 'th' : 'td');
    return row.appendTo(this[to]);
  }

  /**
   * Appends content to the body of the Table element.
   *
   * @param {Element|Object|String} [content=null]
   *   The content to append.
   */
  appendToBody(content = null) {
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
  appendToFooter(content = null) {
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
  appendToHeader(content = null) {
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
  toString(reset = false) {
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
    return super.toString(reset);
  }

}
