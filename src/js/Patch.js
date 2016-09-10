import File from './File';
import Parser from './Parser';
import Renderable from './Renderable';
import _ from './Utility';

export default class Patch extends Renderable {

  /**
   * @class Patch
   *
   * @param {Parser} parser
   *   The Parser object this Patch belongs to.
   * @param {String} string
   *   The contents of a diff file section.
   *
   * @constructor
   */
  constructor(parser, string) {
    super('patch', string, parser, Parser);

    /**
     * An array of File objects.
     *
     * @type {File[]}
     */
    this.files = [];

    /**
     * Meta information for the patch.
     *
     * @type {Object}
     */
    this.meta = null;

    // Split into separate files, delimited by lines starting with "diff".
    let files = this.raw.split(/^diff\s[^\n]+\n/gm);

    // Extract any meta information from the first array item.
    let meta = files.shift();

    // Remove any lingering empty array items.
    files = files.filter(Boolean);

    // Parse any meta info (safe to do now since there is only a few at most).
    this.parseMetaInfo(meta, files);

    // Create the File instances.
    for (let i = 0, l = files.length; i < l; i++) {
      this.files[i] = new File(this, files[i]);
      this.files[i].index = i;
      this.height += this.files[i].height;
      this.size += this.files[i].size;
    }
  }

  /**
   * Retrieves the Parser instance this Patch belongs to.
   *
   * @return {Parser|Diff}
   *   The Parser instance.
   */
  getParser() {
    return this.getParent();
  }

  /**
   * Parses any supplied meta information from a patch.
   *
   * This is typically only ever provided if a patch was created using
   * git-format-patch.
   *
   * @param {String} info
   *   A string of meta information from a patch.
   * @param {Array} files
   *   The array of raw files.
   */
  parseMetaInfo(info, files) {
    if (this.meta) {
      return;
    }
    let meta = {};

    if (info.length) {
      let headers = info.split('\n').filter(Boolean);

      // Determine position of the "first blank line", if any.
      let blank = _.indexOf(headers, '');

      // Determine position of the "scissor", if any.
      let scissor = _.indexOf(headers, '-- >8 --');

      // Join the headers and any subsequent headers from the "body" after the
      // first blank line and/or "scissor" delimiters.
      if (blank !== -1 && scissor !== -1) {
        // If there is no blank line, then just use the headers array length.
        if (blank === -1) {
          blank = headers.length;
        }
        headers = headers.slice(0, blank).concat(headers.slice((scissor !== -1 ? scissor : blank) + 1));
      }

      // Parse any meta information as "email header fields" per RFC 2822.
      // https://tools.ietf.org/html/rfc2822#section-2.2
      let previousKey;
      for (let i = 0, l = headers.length; i < l; i++) {
        let header = headers[i];
        let parts = header.match(/^([\w\d\-_]+):\s(.*)/);
        let key = parts && parts[1] && _.machineName(parts[1]);
        let value = parts && parts[2];
        if (key && value) {
          // Convert to a date object.
          if (/^date/i.test(key)) {
            value = !isNaN(Date.parse(value)) ? new Date(value) : value;
          }
          // Remove the standard git subject prefix ([PATCH]) if there's
          // just one patch. If there is more than one patch ([PATCH n/n])
          // then keeping this prefix is important for identification.
          else if (/^subject/i.test(key)) {
            value = value.replace(/^\[PATCH]\s/, '');
          }
          meta[key] = value;
          previousKey = key;
        }
        // Parse "Long Header Fields" (lines that start with a single space)
        // and append its value to the previous key.
        else if (previousKey && header.match(/^\s/)) {
          meta[previousKey] += header;
        }
        else if (!header || header.match(/^---/)) {
          previousKey = null;
        }
      }

      // Finally, extract any signature and remove it from the last file.
      if (files && files.length) {
        let lastFile = files[files.length - 1];
        let signaturePosition = lastFile.search(/^--\s*\n(.|\n)*$/m);
        if (signaturePosition !== -1) {
          meta.signature = lastFile.substr(signaturePosition).replace(/^--\s*\n/, '') || null;
          if (meta.signature) {
            files[files.length - 1] = lastFile.substr(0, signaturePosition);
          }
        }
      }
    }

    this.meta = meta;
  }

  /**
   * {@inheritDoc}
   *
   * @return {Promise}
   *   A Promise object.
   */
  render() {
    return this.doRender('patch', () => {
      return this.renderContainer()
        .then(() => this.renderMeta())
        .then((meta) => meta.appendTo(this.container))
        .then(() => this.each(this.files, file => file.render()))
        .then(() => this.container);
    });
  }


  /**
   * Renders a menu for sequential patches from git-format-patch output.
   *
   * @return {Promise}
   *   A Promise object.
   */
  renderMenuItem() {
    return this.doRender('patch.menu.item', () => {
      let item = _.createElement('<li>').addClass('patch-item');
      let patch = this.index + 1;
      return _.createElement('<a>')
        .setAttribute('href', '#')
        .setAttribute('data-patch', patch)
        .text(patch)
        .appendTo(item);
    });
  }

  /**
   * @return {Promise}
   *   A Promise object.
   */
  renderMeta() {
    return this.promise((resolve, reject) => {
      let meta = _.createElement('<div>').addClass('patchr-patch-meta');
      if (Object.keys(this.meta).length) {
        let table = _.createElement('<table>').appendTo(meta);
        let body = _.createElement('<tbody>').appendTo(table);
        for (let p in this.meta) {
          if (this.meta.hasOwnProperty(p)) {
            let value = this.meta[p];
            if (value instanceof Date) {
              let iso = typeof value.toISOString === 'function' ? value.toISOString() : false;
              value = typeof value.toLocaleString === 'function' ? value.toLocaleString() : value.toString();
              if (iso) {
                value = `<time datetime="${iso}">${value}</time>`;
              }
            }
            _.createElement(`<tr><td>${p}</td><td>${value}</td></tr>`).appendTo(body);
          }
        }
      }
      else {
        meta.disable();
      }
      resolve(meta);
    });
  }

}
