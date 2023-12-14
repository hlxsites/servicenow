import { loadCSS, loadScript } from '../../scripts/aem.js';
import { section } from '../../scripts/dom-helpers.js';
import { getLocale } from '../../scripts/scripts.js';

// map containing environment configurations
const naasDomains = {
  dev: 'https://www.webdev.servicenow.com',
  qa: 'https://www.webqa.servicenow.com',
  stage: 'https://www.webstg.servicenow.com',
  prod: 'https://www.servicenow.com',
};

export function getDataDomain() {
  const env = new URLSearchParams(window.location.search).get('naas');

  return env ? naasDomains[env.toLowerCase()] || naasDomains.prod : naasDomains.prod;
}

export function fixRelativeDAMImages(block, dataDomain) {
  if (window.location.host.endsWith('servicenow.com')) {
    return;
  }

  block.querySelectorAll('img[src^="/content/dam"]')
    .forEach((image) => { image.src = new URL(new URL(image.src).pathname, dataDomain); });
}

export async function waitImagesLoad(block) {
  const images = block.querySelectorAll('img');

  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      if (img && !img.complete) {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      } else {
        resolve();
      }
    });
  }
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.innerHTML = '';

  document.documentElement.setAttribute('data-path-hreflang', getLocale().toLowerCase());
  const dataDomain = getDataDomain();

  try {
    block.append(
      section({
        id: 'naas-header-old',
        class: 'naas-header-old-section',
        'data-domain': dataDomain,
        'data-myaccount': 'hide',
        'data-search': 'hide',
        'data-sourceId': 'blogs',
        'data-lslinkshard': 'on',
      }),
    );

    // load NaaS header code
    await Promise.all([
      loadCSS(`${dataDomain}/nas/csi/header/v1/headerOldCSR.bundle.css`),
      loadScript(`${dataDomain}/nas/csi/header/v1/headerOldCSR.bundle.js`),
    ]);

    // trigger and wait for NaaS header rendering
    await new Promise((resolve) => {
      document.addEventListener('nass-header-rendered', () => {
        fixRelativeDAMImages(block, dataDomain);
        // eslint-disable-next-line no-unused-expressions
        (async () => {
          await waitImagesLoad(block);
          resolve();
        })();
      });

      document.dispatchEvent(new CustomEvent('naas-load-header'));
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
