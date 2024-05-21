/* eslint-disable no-continue */
import { decorateIcons, fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import {
  a, button, div, form, i, input, li, span,
} from '../../scripts/dom-helpers.js';
import {
  BLOG_QUERY_INDEX,
  analyticsCanonicStr,
  analyticsGlobalClickTrack,
  getLocale,
  getLocaleInfo,
} from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';

function debounce(func, delay) {
  let debounceTimer;
  // eslint-disable-next-line func-names
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

const isDesktop = window.matchMedia('(min-width: 768px)');
const CHUNK_SIZE = 250;

function toggleMenu(nav, desktop, changedScreenSize) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const expand = (!changedScreenSize && !expanded) || desktop.matches;

  nav.setAttribute('aria-expanded', !!expand);
  nav.style.visibility = expand ? 'visible' : 'hidden';
  nav.style.display = expand ? 'table' : 'none';
}

function markSearchTerms(link, searchTerms) {
  // eslint-disable-next-line no-restricted-syntax
  for (const term of searchTerms) {
    const regex = new RegExp(`(${term})`, 'gi');
    link.innerHTML = link.innerHTML.replace(regex, '<mark>$1</mark>');
  }
}

function indicateSearch(block) {
  block.querySelector('form').classList.add('searching');
}

function unindicateSearch(block) {
  block.querySelector('form').classList.remove('searching');
}

function focusSearch(block) {
  block.querySelector('div.search-container').classList.add('search-active');
}

function blurSearch(block) {
  block.querySelector('div.search-container').classList.remove('search-active');
  const searchResults = block.querySelector('.search-results');
  searchResults.style.display = 'none';
  block.querySelector('input').value = '';
  unindicateSearch(block);
}

async function processChunk(block, blogs, searchTerms, container) {
  let done = false;
  const locale = getLocale();
  const prefixLength = getLocaleInfo().placeholdersPrefix.length;
  const foundInHeader = [];
  const foundInMeta = [];
  const foundInContent = [];
  const foundInAuthor = [];

  for (let idx = 0; idx < CHUNK_SIZE; idx += 1) {
    // eslint-disable-next-line no-await-in-loop
    const generate = await blogs.next();
    done = generate.done;
    if (done) {
      break;
    }

    const result = generate.value;
    if (result.locale !== locale) {
      continue;
    }

    // partial match of author
    if (searchTerms.some((term) => result.author.toLowerCase().includes(term))) {
      const link = a({ href: result.path }, result.header);
      foundInAuthor.push(link);

      // check if author link is already displayed
      const authorElement = container.querySelector(`a[href='${result.authorUrl}']`);
      if (!authorElement) {
        const authorLink = a({ href: result.authorUrl }, result.author);
        markSearchTerms(authorLink, searchTerms);
        container.appendChild(authorLink);
      }
      continue;
    }

    if (searchTerms.some((term) => result.header.toLowerCase().includes(term))) {
      const link = a({ href: result.path }, result.header);
      markSearchTerms(link, searchTerms);
      foundInHeader.push(link);
      continue;
    }

    const metaContents = `${result.title} ${result.description} ${result.path.substring(prefixLength)}`.toLowerCase();
    if (searchTerms.some((term) => metaContents.includes(term))) {
      foundInMeta.push(a({ href: result.path }, result.header));
      continue;
    }

    if (searchTerms.some((term) => result.content.toLowerCase().includes(term))) {
      foundInContent.push(a({ href: result.path }, result.header));
    }
  }

  container.append(...[...foundInAuthor, ...foundInHeader, ...foundInMeta, ...foundInContent]);

  if (done) {
    unindicateSearch(block);
  } else {
    processChunk(block, blogs, searchTerms, container);
  }
}

async function handleSearch(block, force = false) {
  const searchValue = block.querySelector('input').value;
  const oldSearchResults = block.querySelector('.search-results');

  // eslint-disable-next-line prefer-destructuring
  const parentElement = oldSearchResults.parentElement;
  oldSearchResults.remove();

  div({ class: 'search-results' });

  const searchResults = div({ class: 'search-results' });
  parentElement.appendChild(searchResults);

  focusSearch(block);

  if (!force && searchValue.length < 3) {
    searchResults.style.display = 'none';
    return;
  }

  indicateSearch(block);

  searchResults.style.display = 'block';

  const searchTerms = searchValue.toLowerCase().split(/\s+/).filter((item) => item !== '');
  const blogs = ffetch(BLOG_QUERY_INDEX)
    .chunks(CHUNK_SIZE)
    .sheet('blogs-content');

  processChunk(block, blogs, searchTerms, searchResults);
}

function addClickTracking(link, block) {
  link.addEventListener('click', (e) => {
    analyticsGlobalClickTrack(
      {
        event: {
          pageArea: 'body',
          eVar22: `blogs:heading:${analyticsCanonicStr(link.textContent)}`,
          click: {
            componentName: block.classList[0],
            destination: link.href,
            ctaText: link.textContent,
            pageArea: 'body',
            section: 'heading',
          },
        },
      },
      e,
    );
  });
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

    blogHeader.querySelectorAll('li a').forEach((link) => {
      addClickTracking(link, block);
    });

    const numberOfSections = blogHeader.querySelectorAll('li').length;
    blogHeader.style.setProperty('--number-of-menu-items', numberOfSections);

    decorateIcons(blogHeader);
    const debouncedSearch = debounce(() => {
      handleSearch(block);
    }, 350);

    const delayedBlur = () => {
      setTimeout(() => {
        blurSearch(block);
      }, 200);
    };

    const placeholders = await placeholdersPromise;

    const searchLi = li({ class: 'blogsearch-menu-container' },
      div({ class: 'blogsearch' }, form({},
        div({ class: 'search-container' },
          i({ class: 'search-icon' }),
          span({ class: 'search-indicator' }),
          input({
            type: 'text',
            'aria-label': placeholders.search || 'Search',
            oninput: () => { debouncedSearch(); },
            onkeydown: (e) => { if (e.code === 'Enter') { e.preventDefault(); handleSearch(block, true); } },
            onkeyup: (e) => { if (e.code === 'Escape') { delayedBlur(); } },
            onblur: () => { delayedBlur(); },
            onfocus: () => { focusSearch(block); },
          })))),
      div({ class: 'search-results' }));

    const navSections = blogHeader.querySelector('ul');
    navSections.appendChild(searchLi);
    navSections.setAttribute('aria-expanded', 'false');

    const menuText = placeholders.mobileMenu || 'Menu';
    blogHeader.prepend(
      div(
        {
          class: 'blogheader-hamburger',
          onclick: () => toggleMenu(navSections, isDesktop),
        },
        button({
          type: 'button',
          'aria-controls': 'blogheader',
          'aria-label': menuText,
        }, menuText),
      ),
    );

    isDesktop.onchange = () => toggleMenu(navSections, isDesktop, true);

    block.append(blogHeader);
  }
}
