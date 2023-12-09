import ffetch from '../../scripts/ffetch.js';
import { BLOG_QUERY_INDEX, BLOG_FILTERS } from '../../scripts/scripts.js';
import { p, a } from '../../scripts/dom-helpers.js';

async function getBlogTopics() {
  return ffetch(BLOG_QUERY_INDEX)
    .sheet('topics')
    .filter(BLOG_FILTERS.locale)
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
}
