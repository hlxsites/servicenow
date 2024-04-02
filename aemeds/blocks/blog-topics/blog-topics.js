import ffetch from '../../scripts/ffetch.js';
import {
  BLOG_QUERY_INDEX,
  BLOG_FILTERS,
  analyticsCanonicStr,
  analyticsGlobalClickTrack,
  getAnalyticsSiteName,
} from '../../scripts/scripts.js';
import { p, a } from '../../scripts/dom-helpers.js';

function closestH3(block) {
  try {
    const h3s = [
      ...block.parentElement // wrapper
        .previousElementSibling // default-content-wrapper
        .querySelectorAll('h3'), // get all h3s
    ];
    return h3s.pop()?.textContent; // last h3
  } catch (err) {
    // don't fail
  }

  return '';
}

// reused in blog-years block
export function clickTrack(block) {
  block.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const section = analyticsCanonicStr(
        closestH3(block) || document.querySelector('h1')?.textContent,
      );
      const ctaText = analyticsCanonicStr(link.textContent);
      const eVar22 = `${section}:${ctaText}`;

      analyticsGlobalClickTrack({
        event: {
          pageArea: 'body',
          eVar22,
          eVar30: getAnalyticsSiteName(),
          click: {
            componentName: block.classList[0],
            destination: link.href,
            ctaText,
            pageArea: 'body',
            ctaText,
            section,
          },
        },
      }, e);
    });
  });
}

async function getBlogTopics() {
  return ffetch(BLOG_QUERY_INDEX)
    .sheet('topics')
    .filter(BLOG_FILTERS.locale)
    .filter((topic) => topic.excludeFromSidebar.trim().toLowerCase() !== 'yes')
    .all();
}

export default async function decorate(block) {
  const blogTopics = await getBlogTopics();
  block.append(
    ...blogTopics.map((topic) => (
      p({ class: 'button-container' },
        a({ href: topic.path, title: topic.header }, topic.header),
      )
    )),
  );

  clickTrack(block);
}
