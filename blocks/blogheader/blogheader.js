import { getMetadata, decorateIcons } from '../../scripts/aem.js';

export default async function decorate(block) {
  const blogHeaderMeta = getMetadata('blogheader');
  const blogHeaderPath = blogHeaderMeta
    ? new URL(blogHeaderMeta).pathname
    : '/blogs/blog-nav';

  const blogHeaderResp = await fetch(`${blogHeaderPath}.plain.html`);

  if (blogHeaderResp.ok) {
    const blogHeaderHtml = await blogHeaderResp.text();

    const blogHeader = document.createElement('nav');
    blogHeader.id = 'blogheader';
    blogHeader.innerHTML = blogHeaderHtml;

    blogHeader
      .querySelector(`li > a[href^='${window.location.pathname}'`)
      ?.parentNode?.classList.add('active');

    decorateIcons(blogHeader);
    block.append(blogHeader);
  }
}
