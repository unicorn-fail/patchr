import File from './File';
import Line from './Line';
import Renderable from './Renderable';
import _ from './Utility';

export default class Hunk extends Renderable {

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
  constructor(file, string) {
    super('hunk', string, file, File);

    /**
     * The hunk header, if any.
     *
     * @type {String}
     */
    this.header = null;

    this.height = 26;

    /**
     * An array of Line objects.
     *
     * @type {Line[]}
     */
    this.lines = [];

    /**
     * The meta information for this hunk.
     *
     * @type {Object}
     */
    this.meta = null;

    /**
     * The source meta info.
     *
     * @type {{start: Number, total: Number}}
     */
    this.source = {start: 0, total: 0};

    /**
     * The target meta info.
     *
     * @type {{start: Number, total: Number}}
     */
    this.target = {start: 0, total: 0};

    let lines = string.split(/\n/);
    this.meta = lines.shift();

    // Filter out completely empty lines, not lines with just whitespace.
    lines = lines.filter(line => line !== '');

    // Create the Line instances.
    for (let i = 0, l = lines.length; i < l; i++) {
      this.lines[i] = new Line(this, lines[i]);
      this.lines[i].index = i;
      this.height += this.lines[i].height;
      this.size += this.lines[i].size;
    }
  }

  /**
   * Retrieves the File instance this Hunk belongs to.
   *
   * @return {File|Diff}
   *   The File instance.
   */
  getFile() {
    return this.getParent();
  }

  /**
   * Highlights code in the hunk.
   */
  highlightCode() {
    // Join each line value to simulate the hunk in its entirety.
    let string = '';
    for (let i = 0, l = this.lines.length; i < l; i++) {
      string += this.lines[i].value + (i !== l - 1 ? '\n' : '');
    }

    let highlighter = this.getPatchrOption('highlighter');
    let callback = this.getPatchrOption('highlight.callback', _.noop);

    // Highlight the hunk code.
    if (highlighter && _.isFunction(callback)) {
      string = (callback.apply(this, [string]) || '');
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
    let lines = string.split('\n');
    for (let i = 0, l = lines.length; i < l; i++) {
      // Skip "no-new-line".
      if (this.lines[i].status === 'no-new-line') {
        continue;
      }
      this.lines[i].value = lines[i];
    }
  }

  /**
   * {@inheritDoc}
   *
   * @return {Promise}
   *   A Promise object.
   */
  parse() {
    return this.doParse('hunk', () => {
      // Extract hunk meta information.
      if (this.meta.length) {
        // Extract the "at" separator, and prepend it to the meta information.
        // This was removed from the hunk split in File.
        let at = this.meta.match(/\s?(@@+)\s?/);
        this.meta = (at && at[1] && at[1] + ' ' || '') + this.meta;

        let parts = this.meta.split(/\s?@@+\s?/).filter(Boolean);
        if (parts[1]) {
          this.header = parts[1];
        }

        let source;
        let target;
        let ranges = parts[0].split(' ');
        if (ranges[0][0] === '-') {
          source = ranges[0].substr(1).split(',');
          target = ranges[1].substr(1).split(',');
        }
        else {
          source = ranges[1].substr(1).split(',');
          target = ranges[0].substr(1).split(',');
        }
        this.source.start = parseInt(source[0], 10);
        this.source.total = parseInt(source[1] || 0, 10);
        this.target.start = parseInt(target[0], 10);
        this.target.total = parseInt(target[1] || 0, 10);
      }

      let sourceStart = this.source.start;
      let targetStart = this.target.start;

      // Parse lines.
      return this.each(this.lines, line => {
        return line.parse().then(() => {
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
  render(table) {
    return this.doRender('hunk', () => {
      // Just create an empty element to house the rows.
      this.rendered = _.createElement();

      if (this.meta) {
        let row = table.addRow().setAttributes(this.attributes).addClass(['patchr-line', 'patchr-line--hunk']);
        row.addCell().setAttribute('data-line-number', '...').addClass('patchr-line-number');
        row.addCell().setAttribute('data-line-number', '...').addClass('patchr-line-number');
        row.addCell().setAttribute('data-hunk-meta', this.meta).addClass('patchr-hunk-meta');
      }

      // Render the lines.
      return this.each(this.lines, line => line.render(table.addRow())).then(() => table);
    });
  }

}
