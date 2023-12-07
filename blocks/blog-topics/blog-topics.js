import ffetch from '../../scripts/ffetch.js';
import {BLOG_QUERY_INDEX, getLocale} from '../../scripts/scripts.js';
import {p, a} from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
    const blogTopics = await getLocaleTopics();
    block.append(
        ...blogTopics.map((topic) => (
          p({class: 'button-container'},
            a({ href: topic.path, title: topic.header }, topic.header)
          )
        )),
    );
}

async function getLocaleTopics() {
    const locale = getLocale();
    window.sidebarTopics = ffetch(`${BLOG_QUERY_INDEX}`)
      .sheet('topics')
      .filter((entry) => entry.locale === locale)
      .all()
    return window.sidebarTopics;
}