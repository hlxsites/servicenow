import { fetchPlaceholders, loadCSS, toClassName } from '../../scripts/aem.js';
import {
  FILTERS, fetchAPI, formatDate, getLocaleInfo, serviceNowDefaultOrigin,
} from '../../scripts/scripts.js';
import {
  a, div, li, span, ul,
} from '../../scripts/dom-helpers.js';
import { fetchHtml, renderCard } from '../cards/cards.js';

const arrowSvg = fetchHtml(`${window.hlx.codeBasePath}/icons/card-arrow.svg`);

export async function renderFilterCard(post) {
  const placeholders = await fetchPlaceholders(getLocaleInfo().placeholdersPrefix);
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
      a({ class: 'cta-readmore', href: post.path, 'aria-label': placeholders.readMore },
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
  block.innerHTML = '';

  // sanitise
  filterKey = toClassName(filterKey.textContent);
  filterValue = filterValue.textContent;

  if (filterKey === 'category' || filterKey === 'topic') {
    filterValue = toClassName(filterValue);
  } else if (filterKey === 'author') {
    // eslint-disable-next-line prefer-destructuring
    filterValue = new URL(filterValue, serviceNowDefaultOrigin).pathname.split('.')[0];
  }

  // get filter function
  const filter = FILTERS[toClassName(filterKey)];
  if (!filter) return;

  // retrieve and filter blog entries
  let blogs = await fetchAPI(`${getLocaleInfo().metadataIndex}?sheet=blogs&limit=10000`);
  if (!blogs) return;
  blogs = filter(blogs.data, filterValue);

  // render
  block.classList.add(filterKey);
  block.append(
    ul(
      ...await Promise.all(blogs.map(renderFilterCard)),
    ),
  );
  await cssPromise;
}
