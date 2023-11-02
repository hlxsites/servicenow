// eslint-disable-next-line import/no-cycle
import { loadScript, sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
async function loadAdobeDTM() {
  await loadScript(`${window.hlx.codeBasePath}/scripts/jquery-3.7.1.min.js`);
  const prod = 'https://assets.adobedtm.com/a441b904b50e/7a4facbbcffb/launch-039be8795dc8.min.js';
  const stage = 'https://assets.adobedtm.com/a441b904b50e/7a4facbbcffb/launch-a2ae4c3b0523-staging.min.js';

  if (window.location.host.endsWith('.page') || window.location.host.startsWith('localhost')) {
    loadScript(stage, { async: '' });
  } else {
    loadScript(prod, { async: '' });
  }
}

loadAdobeDTM();
