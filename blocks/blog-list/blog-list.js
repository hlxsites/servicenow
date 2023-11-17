import { fetchPlaceholders, loadCSS, toClassName } from '../../scripts/aem.js';
import {
  FILTERS, formatDate, getLocaleBlogs, getLocaleInfo, serviceNowDefaultOrigin,
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

export async function renderCustomerStoryCard(post) {
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
       span({ class: 'card-description' }, post.description),
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
  let blogs = await getLocaleBlogs();
  if (!blogs) return;
  blogs = filter(blogs, filterValue);

  // render
  block.classList.add(filterKey);
  if(block.classList.contains('customer-stories')) {
    block.append(
      ul(
       ...await Promise.all(blogs.map(renderCustomerStoryCard)),
      ),
    );
  }else{
    block.append(
      ul(
        ...await Promise.all(blogs.map(renderFilterCard)),
      ),
    );
  }

  await cssPromise;
}
