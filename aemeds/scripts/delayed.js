// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');
// add more delayed functionality here

if (!window.sessionStorage.getItem('adobeLaunchCached')) {
  // defined in the head of the page
  // eslint-disable-next-line no-undef
  loadAdobeDTM();
  sessionStorage.setItem('adobeLaunchCached', 'true');
}
