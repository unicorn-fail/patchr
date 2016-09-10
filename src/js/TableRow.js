import Element from './Element';

export default class TableRow extends Element {

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
  constructor(id = null, cellType = 'td') {
    super('tr');

    /**
     * The cell type.
     *
     * @type {String}
     */
    this.cellType = cellType || 'td';

    this.addClass('patchr-table-row');
    this.id = id;
    if (this.id) {
      this.addClass(`patchr-${this.id}-table-row`);
    }
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
  addCell(content = null) {
    let cell = Element.create(`<${this.cellType}/>`).appendTo(this);
    if (content) {
      cell.html(content);
    }
    return cell;
  }

}
