import Hunk from './Hunk';
import Renderable from './Renderable';
import _ from './Utility';

export default class Line extends Renderable {

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
  constructor(hunk, string) {
    super('line', string, hunk, Hunk);

    /**
     * The source and target line numbers.
     *
     * @type {{source: Number, target: Number}}
     */
    this.lineNumbers = {source: 0, target: 0};

    this.height = 20;

    /**
     * The status of the line.
     *
     * @type {String}
     */
    this.status = null;

    /**
     * The value of the line.
     *
     * @type {String}
     */
    this.value = string.substr(1);

    // Set the size of the line.
    this.size = this.value.length;

    /**
     * The first character of the line, indicating the "status".
     *
     * @type {String}
     */
    this.symbol = string[0];

    switch (this.symbol) {
      case '-':
        this.status = 'deleted';
        break;

      case '+':
        this.status = 'added';
        break;

      case '\\':
        this.status = 'no-new-line';
        this.symbol = '';
        this.value = this.value.replace(/^\s*|\s*$/, '');
        break;

      default:
        this.status = 'context';
    }

    // Increase stats.
    switch (this.status) {
      case 'added':
        this.increaseAddition();
        break;

      case 'deleted':
        this.increaseDeletion();
        break;
    }
  }

  /**
   * Retrieves the Hunk instance this Line belongs to.
   *
   * @return {Hunk|Diff}
   *   The Hunk instance.
   */
  getHunk() {
    return this.getParent();
  }

  /**
   * {@inheritDoc}
   *
   * @return {Promise}
   *   A Promise object.
   */
  parse() {
    return this.doParse('line', () => {
      this.attributes.addClass(`patchr-line--${this.status}`);
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
  render(row) {
    return this.doRender('line', () => {
      let file = this.getHunk().getFile();
      let id = `file-${file.sha1}`;

      row.setAttributes(this.attributes).addClass(['patchr-line', `patchr-line--${this.status}`]);

      // Don't show line numbers for "no-new-line" status.
      if (this.status !== 'no-new-line') {
        // Source line number.
        let source = row.addCell().addClass('patchr-line-number');
        if (this.lineNumbers.source) {
          source
            .setAttribute('id', `${id}-S${this.lineNumbers.source}`)
            .setAttribute('data-line-number', this.lineNumbers.source ? this.lineNumbers.source : '');
        }

        // Target line number.
        let target = row.addCell().addClass('patchr-line-number');
        if (this.lineNumbers.target) {
          target
            .setAttribute('id', `${id}-T${this.lineNumbers.target}`)
            .setAttribute('data-line-number', this.lineNumbers.target ? this.lineNumbers.target : '');
        }
      }

      // Source code.
      let code = row.addCell().addClass('patchr-line-code');

      // Ensure "no-new-line" status spans the line number columns.
      if (this.status === 'no-new-line') {
        code.setAttribute('colspan', 3);
      }

      _.createElement('<span class="patchr-line-code-inner"/>')
        .appendTo(code)
        .setAttribute('data-symbol', this.symbol)
        .html(this.value, true);

      return row;
    });
  }

}
