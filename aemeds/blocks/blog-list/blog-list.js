import {
  fetchPlaceholders, loadCSS, toCamelCase, toClassName,
} from '../../scripts/aem.js';
import {
  BLOG_QUERY_INDEX,
  BLOG_FILTERS,
  getLocaleInfo,
  serviceNowDefaultOrigin,
  analyticsGlobalClickTrack,
  analyticsCanonicStr,
  formatDate,
} from '../../scripts/scripts.js';
import {
  a, button, div, li, span, ul,
} from '../../scripts/dom-helpers.js';
import { fetchHtml, renderCard } from '../cards/cards.js';
import ffetch from '../../scripts/ffetch.js';

const arrowSvg = fetchHtml(`${window.hlx.codeBasePath}/icons/card-arrow.svg`);

function clickTrack(card) {
  card.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const h1 = analyticsCanonicStr(document.querySelector('h1')?.textContent);
      const cardTitle = analyticsCanonicStr(card.querySelector('h5')?.textContent);
      const ctaText = analyticsCanonicStr(card.querySelector('.cta-readmore')?.textContent);
      const eVar22 = `${h1}:${cardTitle}:${ctaText}`;

      analyticsGlobalClickTrack({
        event: {
          pageArea: 'body',
          eVar22,
          click: {
            componentName: 'blog-list',
            destination: link.href,
            ctaText,
            pageArea: 'body',
            section: `${h1}:${cardTitle}`,
          },
        },
      }, e);
    });
  });

  return card;
}

function loadMoreClickTrack(e, loadMoreText) {
  const h1 = analyticsCanonicStr(document.querySelector('h1')?.textContent);
  const ctaText = analyticsCanonicStr(loadMoreText);
  const eVar22 = `${h1}:${ctaText}`;

  analyticsGlobalClickTrack({
    event: {
      pageArea: 'body',
      eVar22,
      click: {
        componentName: 'blog-list',
        destination: window.location.href,
        ctaText,
        pageArea: 'body',
        section: h1,
      },
    },
  }, e);
}

export async function renderFilterCard(post, showDescription) {
  const placeholders = await fetchPlaceholders(getLocaleInfo().placeholdersPrefix);
  const readMoreText = placeholders.readMore || 'Read More';

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
        a({ class: 'cta-readmore', href: post.path, 'aria-label': readMoreText },
          readMoreText,
          cardArrow,
        ),
      ),
  );

  return card;
}

async function renderChunk(cardList, blogs, showDescription) {
  const loadMoreButton = cardList.parentElement.querySelector('button.cta-loadmore');
  if (loadMoreButton) {
    loadMoreButton.remove();
  }

  let done = false;
  const chunk = [];
  for (let i = 0; i < 20; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const generate = await blogs.next();
    done = generate.done;
    if (done) {
      break;
    }
    chunk.push(generate.value);
  }

  const cards = await Promise.all(
    chunk.map((blog) => renderFilterCard(blog, showDescription)),
  );

  cardList.append(...cards.map(clickTrack));

  if (done) return;

  const placeholders = await fetchPlaceholders(getLocaleInfo().placeholdersPrefix);
  const loadMoreText = placeholders.loadMore || 'Load More';

  cardList.parentElement.append(
    button(
      {
        class: 'button secondary cta-loadmore',
        'aria-label': loadMoreText,
        onclick: (e) => {
          try {
            loadMoreClickTrack(e, loadMoreText);
          } catch (err) {
            // no-op
          }
          renderChunk(cardList, blogs, showDescription);
        },
      },
      loadMoreText,
    ),
  );
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
  const filter = BLOG_FILTERS[filterKey];
  if (!filter) {
    // eslint-disable-next-line no-console
    console.warn(`no filter function found for '${filterKey}'`);
    return;
  }

  // retrieve and filter blog entries
  const blogs = ffetch(BLOG_QUERY_INDEX)
    .chunks(250)
    .sheet('blogs')
    .filter(BLOG_FILTERS.locale)
    .filter((blog) => filter(filterValue, blog));

  // render
  block.classList.add(filterKey);
  const showDescription = block.classList.contains('show-description');
  const cardList = ul();
  block.append(cardList);

  await renderChunk(cardList, blogs, showDescription);
  await cssPromise;
}
