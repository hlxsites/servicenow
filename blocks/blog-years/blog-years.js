import ffetch from '../../scripts/ffetch.js';
import { BLOG_QUERY_INDEX, BLOG_FILTERS } from '../../scripts/scripts.js';
import { p, a } from '../../scripts/dom-helpers.js';

async function getTopicYears() {
  return ffetch(`${BLOG_QUERY_INDEX}`)
    .sheet('years')
    .filter(BLOG_FILTERS.locale)
    .all();
}

export default async function decorate(block) {
  const blogYears = await getTopicYears();
  block.append(
    ...blogYears.slice(0, 4).map((item) => (
      p({ class: 'button-container' },
        a({ href: item.path, title: item.title }, item.header),
      )
    )),
  );
}
