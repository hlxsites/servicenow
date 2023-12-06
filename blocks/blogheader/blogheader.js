import { decorateIcons, fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import {
  a, button, div, form, i, input, li, span,
} from '../../scripts/dom-helpers.js';
import {
  BLOG_QUERY_INDEX, getAnalyticsSiteName, getLocale, getLocaleInfo,
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

function toggleMenu(nav, desktop) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const expand = !expanded || desktop.matches;

  nav.setAttribute('aria-expanded', !!expand);
  nav.style.visibility = expand ? 'visible' : 'hidden';
  nav.style.display = expand ? 'table' : 'none';
}

async function getLocaleBlogContents() {
  if (window.serviceNowBlogContents) {
    return window.serviceNowBlogContents;
  }

  const locale = getLocale();
  window.serviceNowBlogContents = ffetch(`${BLOG_QUERY_INDEX}`)
    .sheet('blogs-content')
    .filter((entry) => entry.locale === locale)
    .all();
  return window.serviceNowBlogContents;
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

async function handleSearch(block) {
  const searchValue = block.querySelector('input').value;
  const searchResults = block.querySelector('.search-results');

  focusSearch(block);

  if (searchValue.length < 3) {
    searchResults.style.display = 'none';
    return;
  }

  indicateSearch(block);

  searchResults.style.display = 'block';
  searchResults.innerHTML = '';

  const results = await getLocaleBlogContents();
  const prefixLength = getLocaleInfo().placeholdersPrefix.length;
  const searchTerms = searchValue.toLowerCase().split(/\s+/);
  const includedPaths = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const result of results) {
    const metaContents = `${result.title.toLowerCase()} ${result.description.toLowerCase()} ${result.header.toLowerCase()} ${result.path.substring(prefixLength).toLowerCase()}`;
    if (searchTerms.some((term) => metaContents.includes(term))) {
      const link = a({ href: result.path }, result.header);
      markSearchTerms(link, searchTerms);
      searchResults.append(link);
      includedPaths.push(result.path);
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const result of results) {
    if (!includedPaths.includes(result.path)) {
      if (searchTerms.some((term) => result.content.toLowerCase()
        .includes(term))) {
        searchResults.append(
          a({ href: result.path }, result.header),
        );
      }
    }
  }

  unindicateSearch(block);
}

function addClickTracking(link, block) {
  link.addEventListener('click', (e) => {
    window.appEventData = window.appEventData || [];
    const data = {
      name: 'global_click',
      digitalData: {
        event: {
          pageArea: 'body',
          eVar22: `blogs:heading:${link.textContent.toLowerCase()}`,
          eVar30: getAnalyticsSiteName(),
          click: {
            componentName: block.classList[0],
            destination: new URL(link.href).pathname,
            ctaText: link.textContent,
            pageArea: 'body',
            section: 'heading',
          }
        },
      },
      event: e,
    };
    window.appEventData.push(data);
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
      }, 350);
    };

    const searchLi = li({ class: 'blogsearch-menu-container' },
      div({ class: 'blogsearch' }, form({},
        div({ class: 'search-container' },
          i({ class: 'search-icon' }),
          span({ class: 'search-indicator' }),
          input({
            type: 'text',
            oninput: () => { debouncedSearch(); },
            onkeyup: (e) => { if (e.code === 'Escape') { delayedBlur(); } },
            onblur: () => { delayedBlur(); },
            onfocus: () => { focusSearch(block); },
          })))),
      div({ class: 'search-results' }));

    const navSections = blogHeader.querySelector('ul');
    navSections.appendChild(searchLi);
    navSections.setAttribute('aria-expanded', 'false');

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
