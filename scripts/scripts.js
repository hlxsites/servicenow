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
  loadBlock,
  readBlockConfig,
} from './aem.js';
import {
  a, div, p, span,
} from './dom-helpers.js';
import ffetch from './ffetch.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list
export const serviceNowDefaultOrigin = 'https://www.servicenow.com';
export const TAGS_QUERY_INDEX = '/blogs/tags.json';

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

export const FILTERS = {
  trend: (blogs, trend) => blogs.filter((blog) => trend === toClassName(blog.trend)),
  newTrend: (blogs, newTrend) => blogs.filter((blog) => newTrend === toClassName(blog.newTrend)),
  category: (blogs, category) => blogs.filter((blog) => category === toClassName(blog.category)),
  topic: (blogs, topic) => blogs.filter((blog) => topic === toClassName(blog.topic)),
  year: (blogs, year) => blogs.filter((blog) => year === blog.year),
  author: (blogs, authorUrl) => blogs.filter(
    (blog) => authorUrl === new URL(blog.authorUrl, serviceNowDefaultOrigin).pathname.split('.')[0],
  ),
};

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

export const BLOG_QUERY_INDEX = '/blogs/query-index.json';
// when adding new locales, the 404.html needs to be updated as well
const LOCALE_INFO = {
  'en-US': {
    urlPrefix: '',
    placeholdersPrefix: '/blogs',
  },
  'en-UK': {
    urlPrefix: 'uk',
    placeholdersPrefix: '/uk/blogs',
  },
  'de-DE': {
    urlPrefix: 'de',
    placeholdersPrefix: '/de/blogs',
  },
  'fr-FR': {
    urlPrefix: 'fr',
    placeholdersPrefix: '/fr/blogs',
  },
  'nl-NL': {
    urlPrefix: 'nl',
    placeholdersPrefix: '/nl/blogs',
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
 * Retrievs and retuns the list of blogs for the current locale based on the index
 * Read Only: Consumers of this API should not modify the list, as it is cached
 * @returns {Array} array of blog objects
 */
export async function getLocaleBlogs() {
  if (window.blogs) return window.blogs;

  const response = await fetchAPI(`${BLOG_QUERY_INDEX}?sheet=blogs&limit=10000`);
  if (!response) {
    // eslint-disable-next-line no-console
    console.warn('failed to retrieve blogs.');
    return [];
  }

  const blogs = response.data;
  if (!blogs) {
    // eslint-disable-next-line no-console
    console.warn('failed to retrieve blogs.');
    return [];
  }

  const locale = getLocale();
  window.blogs = blogs.filter((blog) => blog.locale === locale);
  return window.blogs;
}

export async function getTopicTags() {
  if (window.blogTags) return window.blogTags;

  const response = ffetch(`${TAGS_QUERY_INDEX}`)
    .sheet('topic')
    .all();

  if (!response) {
    // eslint-disable-next-line no-console
    console.warn('failed to retrieve topics.');
    return [];
  }

  window.blogTags = response;
  return window.blogTags;
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

function hasInlinedSidebar(main) {
  const sectionMetas = [...main.querySelectorAll('div.section-metadata')];
  for (let i = sectionMetas.length - 1; i >= 0; i -= 1) {
    const meta = readBlockConfig(sectionMetas[i]);
    if (meta.style) {
      const styles = meta.style.split(',').map((style) => toClassName(style.trim()));
      if (styles.includes('sidebar')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Builds an article sidebar and appends it to main in a new section.
 * @param main
 */
function buildSidebar(main, sidebarPath) {
  if (!hasInlinedSidebar(main)) {
    // the article did not come with an inline sidebar
    const sidebarBlock = buildBlock('fragment', [
      [a({ href: sidebarPath }, 'Sidebar')],
    ]);
    sidebarBlock.classList.add('defer-sub-blocks');
    sidebarBlock.dataset.eagerBlock = true;
    const sidebar = div(sidebarBlock); // wrap sidebarBlock in div to create a new section
    main.append(sidebar);
  }
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
  if (main.parentNode !== document.body) { // don't build auto blocks in fragments
    return;
  }
  try {
    const locInfo = getLocaleInfo();

    if (isArticlePage()) {
      buildArticleHeader(main);
      buildArticleCopyright(main);
      buildArticleSocialShare(main);
      buildSidebar(main, `${locInfo.placeholdersPrefix}/fragments/sidebar-article-fragment`);
    }

    const template = toClassName(getMetadata('template'));
    if (['blog-topic', 'blog-category', 'blog-year', 'blog-author'].includes(template)) {
      buildSidebar(main, `${locInfo.placeholdersPrefix}/fragments/sidebar-common-fragment`);
    }

    buildBlogHeader(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

async function loadEagerBlocks(main) {
  const eagerBlocks = main.querySelectorAll('div[data-eager-block]');
  await Promise.all([...eagerBlocks].map((eagerBlock) => loadBlock(eagerBlock)));
}

async function detectSidebar(main) {
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
  }
}

function decorateH3(main) {
  const sidebar = main.querySelector('.section.sidebar');
  const isHomepage = document.body.classList.contains('blog-home-page');
  let allH3;
  if (isHomepage) {
    allH3 = main.querySelectorAll('h3');
  } else if (sidebar) {
    allH3 = sidebar.querySelectorAll('h3');
  }
  if (allH3) {
    allH3.forEach((header) => {
      const headerContent = header.textContent;
      header.textContent = '';
      header.append(span(headerContent));
      header.classList.add('strike-line');
    });
  }
}

/**
 * Checks for the same domain or not and if ends with pdf
 */
function isSameDomainOrPdf(url) {
  const isPdf = url.toLowerCase().endsWith('.pdf');
  const ancUrl = new URL(url);
  return (
    !isPdf
    && (window.location.hostname === ancUrl.hostname
      || ancUrl.hostname.toLowerCase().endsWith('servicenow.com')
      || ancUrl.hostname.toLowerCase().endsWith('.hlx.live')
      || ancUrl.hostname.toLowerCase().endsWith('.hlx.page'))
  );
}

function decorateLinks(main) {
  // Get all anchor elements within the main container
  const links = main.querySelectorAll('a');
  // Loop through each anchor element and add a target based on the business condition
  links.forEach((link) => {
    const href = link.href;
    // Check if the link is from the same domain or ends with ".pdf"
    if (!isSameDomainOrPdf(href)) {
      // Add a target attribute to open in a new tab for external links
      link.setAttribute('target', '_blank');
    } else {
      link.setAttribute('target', '_self');
    }
  });
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
  decorateH3(main);
  decorateLinks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  getLocale(); // set document.documentElement.lang for SEO
  document.title += ' - Service Now';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await loadEagerBlocks(main);
    await detectSidebar(main);
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

export async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
