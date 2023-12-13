import { loadCSS, loadScript } from '../../scripts/aem.js';
import { section } from '../../scripts/dom-helpers.js';
import { getLocale } from '../../scripts/scripts.js';
import { getDataDomain } from '../header/header.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.innerHTML = '';

  document.documentElement.setAttribute('data-path-hreflang', getLocale().toLowerCase());
  const dataDomain = getDataDomain();

  try {
    block.append(
      section({
        id: 'naas-footer',
        class: 'naas-footer-section withPaddings',
        'data-domain': dataDomain,
        'data-sourceId': 'blogs',
        'data-lslinkshard': 'on',
      }),
    );

    // load NaaS footer code
    await Promise.all([
      loadCSS(`${dataDomain}/nas/csi/footer/v1/footerCSR.bundle.css`),
      loadScript(`${dataDomain}/nas/csi/footer/v1/footerCSR.bundle.js`),
    ]);

    // trigger and wait for NaaS footer rendering
    await new Promise((resolve) => {
      document.addEventListener('nass-footer-rendered', () => {
        resolve();
      });

      document.dispatchEvent(new CustomEvent('naas-load-footer'));
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
