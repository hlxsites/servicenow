import { loadScript } from '../../scripts/aem.js';
import { getLocaleInfo } from '../../scripts/scripts.js';

export default async function decorate(block) {

async function loadSocialShare() {
  loadScript('https://platform-api.sharethis.com/js/sharethis.js#property=5cae6f10a8698b001266ffd9&product=inline-share-buttons');

    const localeInfo = getLocaleInfo();

    const socialSharePromise = fetch(`${localeInfo.urlPrefix}/blogs/fragments/social-share.plain.html`);

    const socialShareFragment = await socialSharePromise;
    if (!socialShareFragment.ok) {
        block.innerHTML = `<div></div>`;
        return;
    }
}

const socialShareContainer = block.querySelector('.sharethis-inline-share-buttons');
if (socialShareContainer) {
    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            loadSocialShare(socialShareContainer);
        }
    });
    observer.observe(socialShareContainer);

    setTimeout(() => {
        observer.disconnect();
        loadSocialShare(socialShareContainer);
    }, 3000);

}
}
