// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');
// add more delayed functionality here

if (!window.sessionStorage.getItem('adobeLaunchCached')) {
  loadAdobeDTM();
  sessionStorage.setItem('adobeLaunchCached', 'true');
}