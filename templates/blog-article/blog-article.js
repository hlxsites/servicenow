import { buildBlock, getMetadata, toClassName } from '../../scripts/aem.js';
import { a, div, p } from '../../scripts/dom-helpers.js';
import { buildSidebar, formatDate, getLocaleInfo } from '../../scripts/scripts.js';

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

  const blogheaderSection = main.querySelector('.blogheader').parentElement;

  blogheaderSection.after(
    div( // section
      buildBlock('article-header', [
        [main.querySelector('h1')],
        [
          p(a({ href: authorURL }, author)),
          p(publicationDate),
        ],
      ]),
    ),
  );
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

export default function buildAutoBlocks(main) {
  const locInfo = getLocaleInfo();
  buildArticleHeader(main);
  buildArticleCopyright(main);
  buildArticleSocialShare(main);
  buildSidebar(main, `${locInfo.placeholdersPrefix}/fragments/sidebar-article-fragment`);
}
