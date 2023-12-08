import {
  fetchPlaceholders, loadCSS, toCamelCase, toClassName,
} from '../../scripts/aem.js';
import {
  BLOG_QUERY_INDEX,
  FILTERS, formatDate, getLocaleInfo, serviceNowDefaultOrigin,
} from '../../scripts/scripts.js';
import {
  a, div, li, span, ul,
} from '../../scripts/dom-helpers.js';
import { fetchHtml, renderCard } from '../cards/cards.js';
import ffetch from '../../scripts/ffetch.js';

const arrowSvg = fetchHtml(`${window.hlx.codeBasePath}/icons/card-arrow.svg`);

export async function renderFilterCard(post, showDescription) {
  const placeholders = await fetchPlaceholders(getLocaleInfo().placeholdersPrefix);
  let publicationDate = '';
  if (post.publicationDate) {
    const date = new Date(0);
    date.setUTCSeconds(+post.publicationDate);
    publicationDate = formatDate(date);
  }

  const card = li(await renderCard(post, false));
  const cardText = card.querySelector('.card-text');
  const cardArrow = span({ class: 'card-arrow' });
  cardArrow.innerHTML = await arrowSvg;

  cardText.append(
    span({ class: 'card-date' }, publicationDate),
    showDescription
      ? span({ class: 'card-description' }, post.description)
      : div({ class: 'card-cta' },
        a({ class: 'cta-readmore', href: post.path, 'aria-label': placeholders.readMore },
          placeholders.readMore,
          cardArrow,
        ),
      ),
  );
  return card;
}

async function renderChunk(cardList, blogs,  showDescription) {
  let done = false;
  let chunk = []
  for (let i = 0; i < 20; i++) {
    const generate = await blogs.next();
    done = generate.done;
    if (done) {
      break;
    }
    chunk.push(generate.value);
  }

  cardList.append(
    ...await Promise.all(
      chunk.map((blog) => renderFilterCard(blog, showDescription)),
    ),
  );

  if (done) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      renderChunk(cardList, blogs,  showDescription);
    }
  });
  observer.observe(cardList.children[cardList.children.length - 1]);
}

export default async function decorate(block) {
  const cssPromise = loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards.css`);

  const row = block.children[0];
  let [filterKey, filterValue] = row.children;
  block.innerHTML = '';

  // sanitise
  filterKey = toCamelCase(filterKey.textContent);
  filterValue = filterValue.textContent.trim();

  if (['category', 'topic', 'newTrend', 'trend'].includes(filterKey)) {
    filterValue = toClassName(filterValue);
  } else if (filterKey === 'author') {
    // eslint-disable-next-line prefer-destructuring
    filterValue = new URL(filterValue, serviceNowDefaultOrigin).pathname.split('.')[0];
  }

  // get filter function
  const filter = FILTERS[filterKey];
  if (!filter) {
    // eslint-disable-next-line no-console
    console.warn(`no filter function found for '${filterKey}'`);
    return;
  }

  // retrieve and filter blog entries
  let blogs = ffetch(BLOG_QUERY_INDEX)
    .chunks(250)
    .sheet('blogs')
    .filter(FILTERS.locale)
    .filter((blog) => filter(filterValue, blog));

  // render
  block.classList.add(filterKey);
  const showDescription = block.classList.contains('show-description');
  const cardList = ul();
  block.append(cardList);

  await renderChunk(cardList, blogs, showDescription);
  await cssPromise;
}
