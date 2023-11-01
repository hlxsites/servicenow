/*
 * Fragment Block
 * Include content from one Helix page in another.
 * https://www.hlx.live/developer/block-collection/fragment
 */

import {
  decorateMain,
} from '../../scripts/scripts.js';
import {
  loadBlocks,
} from '../../scripts/aem.js';
import { span } from '../../scripts/dom-helpers.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();
      decorateMain(main);
      await loadBlocks(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    fragment.querySelectorAll('h3').forEach((header) => {
      const headerContent = header.textContent;
      header.textContent = '';
      header.append(span(headerContent));
    });
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.section').classList.add(...fragmentSection.classList);
      block.closest('.sidebar-fragment-wrapper').replaceWith(...fragmentSection.childNodes);
    }
  }
}
