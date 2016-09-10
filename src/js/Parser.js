import Patchr from './Patchr';
import Patch from './Patch';
import Renderable from './Renderable';
import Url from './Url';
import _ from './Utility';

export default class Parser extends Renderable {

  /**
   * @class Parser
   *
   * @param {Patchr} patchr
   *   The Patchr instance.
   * @param {String} string
   *   The diff contents to parse.
   * @param {Url} [url=null]
   *   The Url object associated with the string.
   *
   * @constructor
   */
  constructor(patchr, string, url = null) {
    super('parser', string, patchr);

    /**
     * An array of Patch objects.
     *
     * @type {Patch[]}
     */
    this.patches = [];

    /**
     * The Url object that provided the contents of this file, if any.
     *
     * @type {Url}
     */
    this.url = url && Url.create(url) || null;

    /**
     * The sanitized string.
     *
     * @type {String}
     */
    this.sanitized = this.sanitize(this.raw);

    // Extract sequential constructed patches created using git-format-patch by
    // splitting the file up based on git's "fixed magic date" header.
    // @see https://git-scm.com/docs/git-format-patch
    let patches = this.sanitized.split(/^From \b[0-9a-f]{5,40}\b Mon Sep 17 00:00:00 2001/gm).filter(Boolean);

    // Create the Patch instances.
    for (let i = 0, l = patches.length; i < l; i++) {
      this.patches[i] = new Patch(this, patches[i]);
      this.patches[i].index = i;
      this.height += this.patches[i].height;
      this.size += this.patches[i].size;
    }
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
    if (collect && type === 'parse') {
      this.sanitized = null;
    }
    return collect;
  }

  /**
   * {@inheritDoc}
   *
   * @return {Promise}
   *   A Promise object.
   */
  render() {
    return this.doRender(null, () => {
      this.rendered = _.createElement('<div>').setAttributes(this.attributes).addClass(['patchr-wrapper', 'patchr-reset']);
      let patches = _.createElement('<div>').addClass('patchr-patches').appendTo(this.rendered);
      return this.each(this.patches, (patch) => patch.render().then((content) => patches.append(content)));
    });
  }

  /**
   * Renders a menu for sequential patches from git-format-patch output.
   *
   * @return {Promise}
   *   A Promise object.
   */
  renderPatchesMenu() {
    return this.doRender('patch.menu', () => {
      let menu = _.createElement('<ul>').addClass('patchr-patch-menu').append('<li><strong>Patch</strong></li>');
      if (this.patches.length <= 1) {
        return this.resolve(menu.disable());
      }
      return this.each(this.patches, (patch) => patch.renderMenuItem().then((item) => menu.append(item))).then(() => menu);
    });
  }

}
