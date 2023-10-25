import {
  getMetadata, decorateIcons, buildBlock, loadBlock, decorateBlock,
} from '../../scripts/aem.js';
import { getLocaleInfo } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const blogHeaderMeta = getMetadata('blogheader');
  const localeInfo = getLocaleInfo();
  const blogHeaderPath = blogHeaderMeta
    ? new URL(blogHeaderMeta).pathname
    : 'blog-nav';

  const blogHeaderResp = await fetch(`${localeInfo.urlPrefix}/blogs/fragments/${blogHeaderPath}.plain.html`);

  if (blogHeaderResp.ok) {
    const blogHeaderHtml = await blogHeaderResp.text();

    const blogHeader = document.createElement('nav');
    blogHeader.id = 'blogheader';
    blogHeader.innerHTML = blogHeaderHtml;

    blogHeader
      .querySelector(`li > a[href^='${window.location.pathname}'`)
      ?.parentNode?.classList.add('active');

    decorateIcons(blogHeader);
    const searchBlock = buildBlock('blogsearch', { elems: [] });
    blogHeader.querySelector('div').append(searchBlock);
    decorateBlock(searchBlock);
    loadBlock(searchBlock);

    block.append(blogHeader);
  }
}
