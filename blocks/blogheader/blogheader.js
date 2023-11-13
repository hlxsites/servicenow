import {
  getMetadata, decorateIcons, buildBlock, loadBlock, decorateBlock, fetchPlaceholders,
} from '../../scripts/aem.js';
import {
  a, div, form, input, i, li, button,
} from '../../scripts/dom-helpers.js';
import { getLocaleInfo, debounce } from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';

const isDesktop = window.matchMedia('(min-width: 768px)');

function toggleMenu(nav, desktop) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const expand = !expanded || desktop.matches;

  nav.setAttribute('aria-expanded', !!expand);
  nav.style.visibility = expand ? 'visible' : 'hidden';
  nav.style.display = expand ? 'table' : 'none';
}

async function handleSearch(block) {
  const searchValue = block.querySelector('input').value;
  if (searchValue.length < 3) {
    return;
  }

  const searchResults = block.querySelector('.search-results');
  searchResults.innerHTML = '';

  const entries = await ffetch(`${getLocaleInfo().metadataIndex}`)
    .sheet('blogs-content')
    .filter((entry) => {
      const searchTerms = searchValue.toLowerCase().split(/\s+/);
      const prefixLength = getLocaleInfo().placeholdersPrefix.length;

      return searchTerms.some((term) => (entry.title && entry.title.toLowerCase()
        .includes(term))
        || (entry.description && entry.description.toLowerCase()
          .includes(term))
        || (entry.header && entry.header.toLowerCase()
          .includes(term))
        || (entry.path && entry.path.substring(prefixLength).toLowerCase()
          .includes(term))
        || (entry.content && entry.content.toLowerCase()
          .includes(term)),
      );
    })
    .all();

  // potential improvement: search content separately, first show those
  // that match on title, description and header
  //
  // while sorting by publicationDate would potentially make sense, it's not what's currently
  // implemented on servicenow.com

  // eslint-disable-next-line no-restricted-syntax
  for await (const entry of entries) {
    searchResults.append(
      a({ href: entry.path }, entry.header),
    );
  }
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
    const debouncedSearch = debounce(() => {
      handleSearch(block);
    }, 350);

    const searchLi = li({ class: 'blogsearch-menu-container' },
      div({ class: 'blogsearch' }, form({},
        div({ class: 'search-container' },
          i({ class: 'search-icon' }),
          input({
            type: 'text',
            oninput: () => { debouncedSearch(); }
            ,
          })),
        div({ class: 'search-results' }))));

    const navSections = blogHeader.querySelector('ul');
    navSections.appendChild(searchLi);
    navSections.setAttribute('aria-expanded', 'true');

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
