import {
  div, form, input, i,
} from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
  block.innerHtml = '';
  block.textContent = '';
  block.append(
    form({},
      div({},
        i({ class: 'search-icon' }),
        input({
          type: 'text',
        }))));
}
