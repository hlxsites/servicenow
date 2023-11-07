import {
  buildBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  getMetadata,
  loadBlocks,
  loadCSS,
  loadFooter,
  loadHeader,
  sampleRUM,
  toClassName,
  waitForLCP,
} from './aem.js';
import {
  a, div, p, span,
} from './dom-helpers.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

// when adding new locales, the 404.html needs to be updated as well
const LOCALE_INFO = {
  'en-US': {
    urlPrefix: '',
    placeholdersPrefix: '/blogs',
    metadataIndex: '/blogs/query-index.json',
  },
  'en-UK': {
    urlPrefix: 'uk',
    placeholdersPrefix: '/uk/blogs',
    metadataIndex: '', // TODO issue #30
  },
  'de-DE': {
    urlPrefix: 'de',
    placeholdersPrefix: '/de/blogs',
    metadataIndex: '', // TODO issue #30
  },
  'fr-FR': {
    urlPrefix: 'fr',
    placeholdersPrefix: '/fr/blogs',
    metadataIndex: '', // TODO issue #30
  },
  'nl-NL': {
    urlPrefix: 'nl',
    placeholdersPrefix: '/nl/blogs',
    metadataIndex: '', // TODO issue #30
  },
};

/**
 * Returns the locale of the page based on the path
 * @returns {*|string}
 */
export function getLocale() {
  if (document.documentElement.lang) return document.documentElement.lang;

  document.documentElement.lang = 'en-US';
  const segs = window.location.pathname.split('/');
  if (segs && segs.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(LOCALE_INFO)) {
      if (value.urlPrefix === segs[1]) {
        document.documentElement.lang = key;
        break;
      }
    }
  }
  return document.documentElement.lang;
}

/**
 * Returns the locale information
 * @returns {Object}
 */
export function getLocaleInfo() {
  return LOCALE_INFO[getLocale()] || LOCALE_INFO['en-US'];
}

/**
 * Formats a date in the current locale.
 * @param date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  const locale = getLocale();
  return d.toLocaleDateString(locale, {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}

function buildBlogHeader(main) {
  const section = document.createElement('div');
  section.append(buildBlock('blogheader', { elems: [] }));
  main.prepend(section);
}

/**
 * Builds an article header and prepends to main in a new section.
 * @param main
 */
function buildArticleHeader(main) {
  if (main.querySelector('.article-header')) {
    // already got an article header
    return;
  }

  //
  const author = getMetadata('author');
  const authorURL = getMetadata('author-url') || `/authors/${toClassName(author)}`;
  const publicationDate = formatDate(getMetadata('publication-date'));
  //
  main.prepend(div(buildBlock('article-header', [
    [main.querySelector('h1')],
    [
      p(a({ href: authorURL }, author)),
      p(publicationDate),
    ],
  ])));
}

function buildArticleCopyright(main) {
  if (main.querySelector('.article-copyright')) {
    return;
  }

  main.append(div(buildBlock('article-copyright', { elems: [] })));
}

function buildArticleSocialShare(main) {
  main.append(div(buildBlock('social-share', { elems: [] })));
}

/**
 * Returns true if the page is an article based on the template metadata.
 * @returns {boolean}
 */
function isArticlePage() {
  let blogPage = false;
  const template = getMetadata('template');
  if (template && template === 'Blog Article') {
    blogPage = true;
  }
  return blogPage;
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars
function buildAutoBlocks(main) {
  try {
    if (isArticlePage()) {
      buildArticleHeader(main);
      buildArticleCopyright(main);
      buildArticleSocialShare(main);
    }
    buildBlogHeader(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function detectSidebar(main) {
  const sidebar = main.querySelector('.section.sidebar');
  if (sidebar) {
    main.classList.add('has-sidebar');
    const sidebarOffset = Number.parseInt(
      sidebar.getAttribute('data-start-sidebar-at-section') || '2',
      10,
    ) + 1;

    const numSections = main.children.length - 1;
    main.style = `grid-template-rows: repeat(${numSections}, auto);`;

    sidebar.style.gridRow = `${sidebarOffset} / infinite`;
    for (let i = 0; i < sidebarOffset - 1; i += 1) {
      main.children[i].classList.add('no-sidebar');
    }

    sidebar.querySelectorAll('h3').forEach((header) => {
      const headerContent = header.textContent;
      header.textContent = '';
      header.append(span(headerContent));
    });
  }
}

export async function fetchAPI(path) {
  const response = await fetch(path);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', response);
    return null;
  }
  const json = await response.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', path);
    return null;
  }
  return json;
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  detectSidebar(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  getLocale(); // set document.documentElement.lang for SEO
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
