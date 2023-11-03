import { getMetadata } from '../../scripts/aem.js';
import { getLocaleInfo } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const localeInfo = getLocaleInfo();

  const copyrightPromise = fetch(`${localeInfo.urlPrefix}/blogs/fragments/article-copyright.plain.html`);

  const publicationDate = getMetadata('publication-date');
  const d = new Date(publicationDate);
  const year = d.toLocaleDateString('en', { year: 'numeric' });

  const copyrightFragment = await copyrightPromise;
  if (!copyrightFragment.ok) {
    block.innerHTML = `<div><p>&copy; ${year} ServiceNow</p></div>`;
    return;
  }
  const copyrightText = (await copyrightFragment.text()).replace('#year#', year);
  block.innerHTML = copyrightText;
}
