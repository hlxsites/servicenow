import { fetchAPI, getLocaleInfo } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const responseYears = await fetchAPI('/blogs/query-index.json?sheet=years');
  const localeInfo = getLocaleInfo();
  const blogYears = responseYears.data;
  const filteredBlogYears = blogYears.filter((item) => item.locale === localeInfo);
  filteredBlogYears.slice(0, 4).forEach((item) => {
    const pTag = document.createElement('p');
    pTag.setAttribute('class', 'button-container');
    const aTag = document.createElement('a');
    aTag.setAttribute('href', item.path);
    aTag.setAttribute('title', item.title);
    const textNode = document.createTextNode(item.header);
    aTag.appendChild(textNode);
    pTag.appendChild(aTag);
    block.appendChild(pTag);
  });
}
