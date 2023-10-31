// eslint-disable-next-line import/no-cycle
import { loadScript, sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
loadScript(`${window.hlx.codeBasePath}/scripts/jquery-3.7.1.min.js`).then(() => {
  loadScript('https://assets.adobedtm.com/a441b904b50e/7a4facbbcffb/launch-039be8795dc8.min.js', { async: '' });
});
