import { fetchPlaceholders, loadCSS, toClassName } from '../../scripts/aem.js';
import { fetchAPI, formatDate } from '../../scripts/scripts.js';
import {
  a, div, li, span, ul,
} from '../../scripts/dom-helpers.js';
import { fetchHtml, renderCard } from '../cards/cards.js';

const domain = 'https://www.servicenow.com';

const arrowSvg = fetchHtml(`${window.hlx.codeBasePath}/icons/card-arrow.svg`);

const FILTERS = {
  category: (blogs, category) => blogs.filter((blog) => category === toClassName(blog.category)),
  topic: (blogs, topic) => blogs.filter((blog) => topic === toClassName(blog.topic)),
  year: (blogs, year) => blogs.filter((blog) => year === blog.year),
  author: (blogs, authorUrl) => blogs.filter(
    (blog) => authorUrl === new URL(blog.authorUrl, domain).pathname.split('.')[0],
  ),
};

export async function renderFilterCard(post) {
  // TODO geosite specific placeholders
  const placeholders = await fetchPlaceholders('/blogs');
  let publicationDate = '';
  if (post.publicationDate) {
    const date = new Date(0);
    date.setUTCSeconds(+post.publicationDate);
    publicationDate = formatDate(date);
  }

  const card = li(renderCard(post));
  const cardText = card.querySelector('.card-text');
  const cardArrow = span({ class: 'card-arrow' });
  cardArrow.innerHTML = await arrowSvg;

  cardText.append(
    span({ class: 'card-date' }, publicationDate),
    div({ class: 'card-cta' },
      a({ class: 'cta-readmore', href: post.path },
        placeholders.readMore,
        cardArrow,
      ),
    ),
  );

  return card;
}

export default async function decorate(block) {
  const cssPromise = loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards.css`);

  const row = block.children[0];
  let [filterKey, filterValue] = row.children;

  // sanitise
  filterKey = toClassName(filterKey.textContent);
  filterValue = filterValue.textContent;

  if (filterKey === 'category' || filterKey === 'topic') {
    filterValue = toClassName(filterValue);
  } else if (filterKey === 'author') {
    // eslint-disable-next-line prefer-destructuring
    filterValue = new URL(filterValue, domain).pathname.split('.')[0];
  }

  // get filter function
  const filter = FILTERS[toClassName(filterKey)];
  if (!filter) return;

  // retrieve and filter blog entries
  // TODO geosite specific index
  let blogs = await fetchAPI('/blogs/query-index.json?limit=10000');
  if (!blogs) return;
  blogs = filter(blogs.data, filterValue);

  // render
  block.innerHTML = '';
  block.classList.add(filterKey);
  block.append(
    ul(
      ...await Promise.all(blogs.map(renderFilterCard)),
    ),
  );
  await cssPromise;
}
