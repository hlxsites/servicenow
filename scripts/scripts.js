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

const LANG = {
  EN: 'en',
  UK: 'uk',
  DE: 'de',
  FR: 'fr',
  NL: 'nl',
};

const LANG_LOCALE = {
  en: 'en-US',
  uk: 'en-UK',
  de: 'de-DE',
  fr: 'fr-FR',
  nl: 'nl-NL',
};

let language;

/**
 * Returns the language of the page based on the path.
 * @returns {*|string}
 */
export function getLanguage() {
  if (language) return language;
  language = LANG.EN;
  const segs = window.location.pathname.split('/');
  if (segs && segs.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [, value] of Object.entries(LANG)) {
      if (value === segs[1]) {
        language = value;
        break;
      }
    }
  }
  return language;
}

/**
 * Returns the locale of the page based on the language.
 * @returns {*}
 */
export function getLocale() {
  const lang = getLanguage();
  return LANG_LOCALE[lang];
}

/**
 * Formats a date in the current locale.
 * @param date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const locale = getLocale();
  return d.toLocaleDateString(locale, {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
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
    // buildHeroBlock(main);
    if (isArticlePage()) {
      buildArticleHeader(main);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function detectSidebar(main) {
  const sidebar = main.querySelector('.section.sidebar');
  if (sidebar) {
    main.classList.add('has-sidebar');
    const sidebarOffset = sidebar.getAttribute('data-start-sidebar-at-section');

    const numSections = main.children.length - 1;
    main.style = `grid-template-rows: repeat(${numSections}, auto);`;

    if (sidebarOffset && Number.parseInt(sidebar.getAttribute('data-start-sidebar-at-section'), 10)) {
      const offset = Number.parseInt(sidebar.getAttribute('data-start-sidebar-at-section'), 10);
      sidebar.style.gridRow = `${offset} / infinite`;
    }

    sidebar.querySelectorAll('h3').forEach((header) => {
      const headerContent = header.textContent;
      header.textContent = '';
      header.append(span(headerContent));
    });
  }
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
  document.documentElement.lang = 'en';
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

  Promise.all([
    loadHeader(doc.querySelector('header')),
    loadFooter(doc.querySelector('footer')),
  ]).then(() => {
    document.addEventListener('nass-header-rendered', () => {
      // work-around
      if (window.location.host !== 'www.servicenow.com') {
        document.querySelectorAll('header img[src^="/content/dam"], footer img[src^="/content/dam"]')
          .forEach((image) => { image.src = `https://www.servicenow.com${new URL(image.src).pathname}`; });
      }
    });
    window.document.dispatchEvent(new Event('DOMContentLoaded'));
  });

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
