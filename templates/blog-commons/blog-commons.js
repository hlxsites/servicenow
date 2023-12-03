import { buildBlock } from '../../scripts/aem.js';
import { buildSidebar, getLocaleInfo, getTemplate } from '../../scripts/scripts.js';

function buildBlogHeader(main) {
  const section = document.createElement('div');
  section.append(buildBlock('blogheader', { elems: [] }));
  main.prepend(section);
}

export default function buildAutoBlocks(main) {
  document.title += ' - ServiceNow Blog';
  const locInfo = getLocaleInfo();
  if (!['blog-article', 'blog-home-page'].includes(getTemplate())) {
    buildSidebar(main, `${locInfo.placeholdersPrefix}/fragments/sidebar-common-fragment`);
  }

  buildBlogHeader(main);
}