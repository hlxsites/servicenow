import { decorateIcons } from '../../scripts/aem.js';

export default function decorate(block) {
    // const url = window.location.href;
    block.innerHTML = `
    <ul>
        <li><a href="https://www.linkedin.com/company/servicenow/" aria-label="Share on LinkedIn"><span class="icon icon-linkedin"></span></a></li>
        <li><a href="https://twitter.com/servicenow" aria-label="Share on Twitter"><span class="icon icon-twitter"></span></a></li>
        <li><a href="https://www.youtube.com/user/servicenowinc" aria-label="Share on Youtube"><span class="icon icon-youtube"></span></a></li>
        <li><a href="https://www.facebook.com/servicenow" aria-label="Share on Facebook"><<span class="icon icon-facebook"></span></a></li>
        <li><a href="https://www.instagram.com/servicenow/" aria-label="Share on instagram"><span class="icon icon-instagram"></span></a></li>
        <li><a href="https://www.tiktok.com/@servicenow?_t=8cb3UL2wZOU&_r=1" aria-label="Share on tiktok"><span class="icon icon-tiktok"></span></a></li>
    </ul>`;
    block.querySelectorAll('a').forEach((link) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
    decorateIcons(block);
}