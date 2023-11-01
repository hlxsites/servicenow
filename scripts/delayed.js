// eslint-disable-next-line import/no-cycle
import { loadScript, sampleRUM } from './aem.js';

loadScript('https://buttons-config.sharethis.com/js/5cae6f10a8698b001266ffd9.js');
loadScript('https://platform-api.sharethis.com/js/sharethis.js#property=5cae6f10a8698b001266ffd9&product=inline-share-buttons');
loadScript('https://count-server.sharethis.com/v2.0/get_counts?cb=window.__sharethis__.cb&url=https%3A%2F%2Fwww.servicenow.com%2Fblogs%2F2023%2Fvancouver-release-genai-security-agility.html');
// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
