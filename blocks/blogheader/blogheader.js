import {
  getMetadata, decorateIcons, buildBlock, loadBlock, decorateBlock, fetchPlaceholders,
} from '../../scripts/aem.js';
import { getLocaleInfo } from '../../scripts/scripts.js';
import { li, div, button } from '../../scripts/dom-helpers.js';

const isDesktop = window.matchMedia('(min-width: 768px)');

function toggleMenu(nav, desktop) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const expand = !expanded || desktop.matches;

  nav.setAttribute('aria-expanded', !!expand);
  nav.style.visibility = expand ? 'visible' : 'hidden';
  nav.style.display = expand ? 'table' : 'none';
}

export default async function decorate(block) {
  const blogHeaderMeta = getMetadata('blogheader');
  const localeInfo = getLocaleInfo();
  const blogHeaderPath = blogHeaderMeta
    ? new URL(blogHeaderMeta).pathname
    : 'blog-nav';

  const blogHeaderResp = await fetch(`${localeInfo.urlPrefix}/blogs/fragments/${blogHeaderPath}.plain.html`);

  if (blogHeaderResp.ok) {
    const placeholdersPromise = fetchPlaceholders(getLocaleInfo().placeholdersPrefix);
    const blogHeaderHtml = await blogHeaderResp.text();

    const blogHeader = document.createElement('nav');
    blogHeader.id = 'blogheader';
    blogHeader.innerHTML = blogHeaderHtml;
    blogHeader.querySelector('nav > div').classList.add('blogheader-sections');

    blogHeader
      .querySelector(`li > a[href^='${window.location.pathname}'`)
      ?.parentNode?.classList.add('active');

    const numberOfSections = blogHeader.querySelectorAll('li').length;
    blogHeader.style.setProperty('--number-of-menu-items', numberOfSections);

    decorateIcons(blogHeader);
    const searchBlock = buildBlock('blogsearch', { elems: [] });
    const searchLi = li({ class: 'blogsearch-menu-container' });
    searchLi.appendChild(searchBlock);
    const navSections = blogHeader.querySelector('ul');
    navSections.appendChild(searchLi);
    navSections.setAttribute('aria-expanded', 'true');
    decorateBlock(searchBlock);
    loadBlock(searchBlock);

    const placeholders = await placeholdersPromise;

    const menuText = placeholders.mobileMenu || 'Menu';
    blogHeader.prepend(
      div({
        class: 'blogheader-hamburger',
      },
      button({
        type: 'button',
        'aria-controls': 'nav',
        'aria-label': menuText,
        onclick: () => toggleMenu(navSections, isDesktop),
      }, menuText),
      ),
    );

    isDesktop.addEventListener('change', () => toggleMenu(navSections, isDesktop));

    block.append(blogHeader);
  }
}
