import Hunk from './Hunk';
import Patch from './Patch';
import Renderable from './Renderable';
import Table from './Table';
import _ from './Utility';

export default class File extends Renderable {

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
  constructor(patch, string) {
    super('file', string, patch, Patch);

    /**
     * {@inheritDoc}
     *
     * @type {Object|Number}
     */
    this.border = 1;

    /**
     * The file extension.
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
     * {@inheritDoc}
     *
     * @type {Number}
     */
    this.height = 43; // Initial height for header.

    /**
     * {@inheritDoc}
     *
     * @type {Object|Number}
     */
    this.margin = {top: 30};

    /**
     * An array of Hunk objects.
     *
     * @type {Hunk[]}
     */
    this.hunks = [];

    /**
     * The array index associated with this object.
     *
     * @type {Number}
     */
    this.index = null;

    /**
     * The source file in the diff.
     *
     * @type {String}
     */
    this.source = null;

    /**
     * The status of this file: added, deleted, modified or renamed.
     *
     * @type {String}
     */
    this.status = null;

    /**
     * The target file in the diff.
     *
     * @type {String}
     */
    this.target = null;

    // Separate file into hunks.
    let hunks = this.raw.split(/^@@+\s/gm).filter(Boolean);

    this.meta = hunks.shift().split(/\n/);

    // Extract the file meta information.
    for (let i = 0, l = this.meta.length; i < l; i++) {
      let line = this.meta[i];
      // Skip null and index values.
      if (/\/dev\/null|^index\s/.test(line)) {
        continue;
      }
      // Source file.
      if (/^---\s/.test(line)) {
        // Remove mnemonic prefixes.
        // @see https://git-scm.com/docs/diff-config (diff.mnemonicPrefix)
        this.source = line.replace(/^---\s(?:(?:a|b|c|i|o|w|1|2)\/)?/, '');
      }
      // Target file.
      else if (/^\+\+\+\s/.test(line)) {
        // Remove mnemonic prefixes.
        // @see https://git-scm.com/docs/diff-config (diff.mnemonicPrefix)
        this.target = line.replace(/^\+\+\+\s(?:(?:a|b|c|i|o|w|1|2)\/)?/, '');
      }
    }

    if (!this.source && this.target) {
      this.filename = this.target;
      this.status = 'added';
    }
    else if (this.source && !this.target) {
      this.filename = this.source;
      this.status = 'deleted';
    }
    else if (this.source && this.target && this.source !== this.target) {
      this.filename = this.source + ' -> ' + this.target;
      this.status = 'renamed';
    }
    else if (this.source === this.target) {
      this.filename = this.target;
      this.status = 'modified';
    }

    // Determine the extension to associate with the File object.
    this.extension = _.extension(this.target ? this.target : this.source);

    // Create the Hunk instances.
    for (let i = 0, l = hunks.length; i < l; i++) {
      this.hunks[i] = new Hunk(this, hunks[i]);
      this.hunks[i].index = i;
      this.height += this.hunks[i].height;
      this.size += this.hunks[i].size;
    }
  }

  /**
   * Retrieves the Patch instance this File belongs to.
   *
   * @return {Patch|Diff}
   *   The Patch instance.
   */
  getPatch() {
    return this.getParent();
  }

  /**
   * {@inheritDoc}
   *
   * @return {Promise}
   *   A Promise object.
   */
  parse() {
    return this.doParse(null, () => this.each(this.hunks, hunk => hunk.parse()));
  }

  /**
   * {@inheritDoc}
   *
   * @return {Promise}
   *   A Promise object.
   */
  render() {
    return this.doRender('file', () => {
      this.renderContainer();
      this.header = _.createElement('<div>').addClass('patchr-file-header').appendTo(this.container);
      _.createElement('<div>').addClass('patchr-file-info').appendTo(this.header)
        .append(this.renderDiffStats())
        .append(this.renderStatus())
        .append(this.renderFilename());
      this.table = new Table(this.name).appendTo(this.container);
      return this.each(this.hunks, hunk => hunk.render(this.table)).then(() => this.container);
    });
  }

  renderPlaceholder() {
    let header = _.createElement('<div>').addClass('patchr-file-header');
    _.createElement('<div>').addClass('patchr-file-info')
      .append(this.getPatchrOption('throbber').replace('patchr-throbber', 'patchr-throbber xs in'))
      .append(this.renderStatus())
      .append(this.renderFilename())
      .appendTo(header);
    return this.renderContainer().append(header);
  }

  /**
   * Renders the filename.
   *
   * @return {Element|String}
   *   The Element object containing the rendered HTML. Can be cast to
   *   a string value or manually invoked using the toString method.
   */
  renderFilename() {
    return _.createElement('<span>').addClass('patchr-filename').text(this.filename);
  }

  /**
   * Determines which abbreviation to use for the status.
   *
   * @return {Element|String}
   *   The Element object containing the rendered HTML. Can be cast to
   *   a string value or manually invoked using the toString method.
   */
  renderStatus() {
    let status = '?';
    if (this.status === 'added') {
      status = 'A';
    }
    else if (this.status === 'deleted') {
      status = 'D';
    }
    else if (this.status === 'modified') {
      status = 'M';
    }
    else if (this.status === 'renamed') {
      status = 'R';
    }
    return _.createElement('<span>').text(status)
      .addClass(['patchr-file-status', `patchr-file-status--${this.status ? this.status : 'unknown'}`])
      .setAttribute('title', this.status[0].toUpperCase() + this.status.substr(1));
  }

}
