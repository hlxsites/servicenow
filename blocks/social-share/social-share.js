import { loadScript, getMetadata } from '../../scripts/aem.js';

// FIXME: update date before launch
const esdCutOff = new Date('2023-06-30');

function socialShareTracking(block) {
  block.addEventListener('click', (e) => {
    const button = e.target.parentElement;

    if (button.classList.contains('st-btn')) {
      const networkLabel = button.getAttribute('data-network');

      window.appEventData = window.appEventData || [];
      const data = {
        name: 'global_click',
        digitalData: {
          event: {
            pageArea: 'social-sharing',
            eVar22: `sharethis-link:${networkLabel}`,
          },
        },
        event: e,
      };
      window.appEventData.push(data);
    }
  });
}

export default async function decorate(block) {
  block.classList.add('sharethis-inline-share-buttons');

  async function loadSocialShare() {
    loadScript('https://platform-api.sharethis.com/js/sharethis.js#property=5cae6f10a8698b001266ffd9&product=inline-share-buttons');
  }

  if (window.location.hostname !== 'www.servicenow.com' && window.location.hostname !== 'localhost') {
    const pubDateStr = getMetadata('publication-date');
    if (pubDateStr) {
      const pubDate = new Date(pubDateStr);
      if (pubDate < esdCutOff) {
        block.dataset.url = `https://www.servicenow.com${window.location.pathname}.html`;
      }
    }
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
  }, 3000);

  socialShareTracking(block);
}
