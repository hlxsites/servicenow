import { loadCSS, loadScript } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

async function fetchHtml(path) {
  const response = await fetch(path);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading fragment details', response);
    return null;
  }
  const text = await response.text();
  if (!text) {
    // eslint-disable-next-line no-console
    console.error('html empty', path);
    return null;
  }
  return text;
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.innerHTML = '';

  try {
    // eslint-disable-next-line no-unused-vars, prefer-const
    let [css, content, js] = await Promise.all([
      loadCSS('https://www.servicenow.com/nas/ssi/header/v1/headerOld.bundle.css'),
      // commented due to CORS issue
      // fetchHtml('https://www.servicenow.com/header-footer/jcr:content/header.html')
      fetchHtml('/blocks/header/header.html'),
      loadScript('https://www.servicenow.com/nas/ssi/header/v1/headerOld.bundle.js'),
    ]);

    if (!window.location.host.includes('servicenow.com')) {
      content = content.replaceAll('/content/dam', 'https://www.servicenow.com/content/dam');
    }

    const headerSection = div();
    headerSection.innerHTML = content;
    block.append(headerSection.querySelector('#naas-header-old'));

    // trigger NaaS JS
    window.document.dispatchEvent(new Event('DOMContentLoaded'));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
