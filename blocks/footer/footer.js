import { readBlockConfig, decorateIcons } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;

    footer.children[0].classList.add('contact');
    footer.children[1].classList.add('geo');
    footer.children[2].classList.add('company-links');
    footer.children[3].classList.add('subscribe-to-updates');
    footer.children[4].classList.add('socials');
    footer.children[5].classList.add('bottom');

    // decorate footer icons
    decorateIcons(footer);
    block.append(footer);
  }
}