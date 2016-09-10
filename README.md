# patchr

> An event and Promise based JavaScript parser and render (to HTML) for unified diff files.

```js
import fs from 'fs';
import { Patchr } from 'src/js';

// Get a patch from somewhere on the file system.
const string = fs.readFileSync('./some-unified-diff.patch', 'utf8');

// Create a new patchr instance.
const patchr = new Patchr();

patchr
// Parse the data.
.parse(string)
.then((/** @type {Parser} */ parser) => {
  // Parser.render();
})
.then((/** @type {Element} */ element) => {
  element.addClass('my-custom-class');
  console.log(element.toString());
});
```
