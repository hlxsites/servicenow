import ffetch from '../../scripts/ffetch.js';
import { BLOG_QUERY_INDEX, getLocale } from '../../scripts/scripts.js';
import { p, a } from '../../scripts/dom-helpers.js';

async function getTopicYears() {
  const locale = getLocale();
  window.sidebarYears = ffetch(`${BLOG_QUERY_INDEX}`)
    .sheet('years')
    .filter((entry) => entry.locale === locale)
    .all();
  return window.sidebarYears;
}

export default async function decorate(block) {
  const blogYears = await getTopicYears();
  block.append(
    ...blogYears.map((item) => (
      p({ class: 'button-container' },
        a({ href: item.path, title: item.title }, item.header),
      )
    )),
  );
}
