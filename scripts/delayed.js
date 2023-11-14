// eslint-disable-next-line import/no-cycle
import { loadScript, sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');
// add more delayed functionality here
async function loadAdobeDTM() {
  await loadScript(`${window.hlx.codeBasePath}/scripts/jquery-3.7.1.min.js`);
  const prod = 'https://assets.adobedtm.com/a441b904b50e/7a4facbbcffb/launch-039be8795dc8.min.js';
  const stage = 'https://assets.adobedtm.com/a441b904b50e/7a4facbbcffb/launch-a2ae4c3b0523-staging.min.js';

  const { host } = window.location;
  if (host === 'servicenow.com' || host === 'www.servicenow.com' || host.endsWith('.live')) {
    loadScript(prod, { async: '' });
  } else {
    if (new URLSearchParams(window.location.search).get('disableLaunch') === 'true') {
      return;
    }
    loadScript(stage, { async: '' });
  }
}

loadAdobeDTM();
