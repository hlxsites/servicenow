import { getMetadata } from '../../scripts/aem.js';
import { getLocaleInfo } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const copyrightPath = getMetadata('copyright-path');

  const localeInfo = getLocaleInfo();
  const copyrightFragmentPath = copyrightPath
    ? new URL(copyrightPath).pathname
    : 'article-copyright';

  const copyrightPromise = fetch(`${localeInfo.urlPrefix}/blogs/fragments/${copyrightFragmentPath}.plain.html`);

  const publicationDate = getMetadata('publication-date');
  const d = new Date(publicationDate);
  const year = d.toLocaleDateString('en', { year: 'numeric' });

  const copyrightFragment = await copyrightPromise;
  const copyrightText = (await copyrightFragment.text()).replace('#year#', year);
  block.innerHTML = copyrightText;
}
