import { fetchAPI } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const responseYears = await fetchAPI('/blogs/query-index.json?sheet=years');
  const blogYears = responseYears.data;
  blogYears.forEach((item) => {
    const pTag = document.createElement('p');
    pTag.setAttribute('class', 'button-container');
    const aTag = document.createElement('a');
    aTag.setAttribute('href', item.path);
    aTag.setAttribute('title', item.title);
    const textNode = document.createTextNode(item.header);
    aTag.appendChild(textNode);
    pTag.appendChild(aTag);
    sidebarBolgTopic.appendChild(pTag);
  });
}