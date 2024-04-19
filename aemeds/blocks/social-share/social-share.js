import { loadScript, getMetadata } from '../../scripts/aem.js';
import {
  analyticsCanonicStr,
  analyticsGlobalClickTrack,
} from '../../scripts/scripts.js';

// FIXME: update date before launch
const esdCutOff = new Date('2024-04-16'); // 16 April 2024

function socialShareTracking(block) {
  block.addEventListener('click', (e) => {
    let button = e.target;
    if (!button.classList.contains('st-btn')) {
      button = button.closest('.st-btn');
    }
    if (!button) return;

    const section = `${analyticsCanonicStr(document.querySelector('h1')?.textContent)}:sharethis-link`;
    const ctaText = button.getAttribute('data-network');

    analyticsGlobalClickTrack({
      event: {
        pageArea: 'social-sharing',
        eVar22: ctaText,
        click: {
          componentName: block.classList[0],
          pageArea: 'social-sharing',
          section,
          ctaText,
        },
      },
    }, e);

  });
}

export default async function decorate(block) {
  block.classList.add('sharethis-inline-share-buttons');

  async function loadSocialShare() {
    loadScript('https://platform-api.sharethis.com/js/sharethis.js#property=5cae6f10a8698b001266ffd9&product=inline-share-buttons');
  }

  if (window.location.hostname !== 'www.servicenow.com' && window.location.hostname !== 'localhost') {
    // this default allows .page and .live variants to show the counter of the published page
    let dataUrl = `https://www.servicenow.com${window.location.pathname}`;
    const pubDateStr = getMetadata('publication-date');
    if (pubDateStr) {
      const pubDate = new Date(pubDateStr);
      if (pubDate < esdCutOff) {
        dataUrl = `https://www.servicenow.com${window.location.pathname}.html`;
      }
    }
    block.dataset.url = dataUrl;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      loadSocialShare();
    }
  });
  observer.observe(block);

  setTimeout(() => {
    observer.disconnect();
    loadSocialShare();
  }, 5000);

  socialShareTracking(block);
}
