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
        'id': 'naas-header-v3',
        'class': 'cmp-nav__wrapper',
        'data-domain': dataDomain,
        'data-myaccount': 'hide',
        'data-search': 'hide',
        'data-sourceId': 'www',
        'data-lslinkshard':'on', 
        'data-version':'v3', 
        'role':'banner',
        'data-theme':'dark',
      }),
    );

    // load NaaS header code
    await Promise.all([
      loadScript(`${dataDomain}/nas/csi/naas.csr.bundles.versioning.init.js`),
    ]);

    const head = document.head || document.getElementsByTagName('head')[0];
    let headerCSS = document.createElement('script');
    headerCSS.setAttribute('id', 'header-bundle-css');
    head.appendChild(headerCSS);
    let data = { id: 'header-bundle-css', type: 'header', version: 'v3', env: dataDomain, ext: 'css' };
    let event = new CustomEvent('naas-create-bundle', { detail: data });
    document.dispatchEvent(event);


    let headerJS = document.createElement('script');
    headerJS.setAttribute('id', 'header-bundle-js');
    head.appendChild(headerJS);
    data = { id: 'header-bundle-js', type: 'header', version: 'v3', env: dataDomain, ext: 'js' };
    event = new CustomEvent('naas-create-bundle', { detail: data });
    document.dispatchEvent(event);

    document.addEventListener("naas-load-header", function(){
      let unifiedHeaderUtilsScriptSrc;
      unifiedHeaderUtilsScriptSrc = dataDomain+'/nas/common/consumers/blogs/naas-right-side-utils.v1.0.js';
      
      const unifiedHeaderUtilsScript = document.createElement('script');
      unifiedHeaderUtilsScript.src = unifiedHeaderUtilsScriptSrc;
      unifiedHeaderUtilsScript.defer = true;
      unifiedHeaderUtilsScript.charset = 'UTF-8';
      head?.appendChild(unifiedHeaderUtilsScript);
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
