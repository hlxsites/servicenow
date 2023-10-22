import { createOptimizedPicture } from '../../scripts/aem.js';
import { a, div, h5 } from '../../scripts/dom-helpers.js';

export async function fetchHtml(path) {
  const response = await fetch(path);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading fragment details', response);
    return null;
  }
  const text = await response.text();
  if (!text) {
    // eslint-disable-next-line no-console
    console.error('html empty', path);
    return null;
  }
  return text;
}

async function fetchAPI(path) {
  const response = await fetch(path);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', response);
    return null;
  }
  const json = await response.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', path);
    return null;
  }
  return json;
}

export function renderCard(post) {
  return (
    div({ class: 'card' },
      div({ class: 'card-thumbnail' },
        a({ href: post.path },
          createOptimizedPicture(post.image, post.header),
        ),
        post.topic ? div({ class: 'topic-tag' }, div(post.topic)) : '',
      ),
      div({ class: 'card-text' },
        h5(post.header),
      ),
    )
  );
}

function isApiCall(path) {
  return path?.split('?')[0]?.endsWith('.json');
}

function fetchLinkBasedCards(cardInfos, links) {
  return links.map(async (postLink) => {
    const fragmentHtml = await fetchHtml(postLink.href);
    if (fragmentHtml) {
      const fragmentElement = div();
      fragmentElement.innerHTML = fragmentHtml;

      const header = fragmentElement.querySelector('h1').textContent;
      const image = fragmentElement.querySelector('img')
        .getAttribute('src');
      const topic = fragmentElement.querySelector('meta[name="topic"]')
        .getAttribute('content');

      cardInfos[postLink.idx] = {
        path: postLink.href,
        header,
        image,
        topic,
      };
    }
  });
}

function fetchAPIBasedCards(cardInfos, apis) {
  return apis.map(async (apiLink) => {
    cardInfos[apiLink.idx] = (await fetchAPI(apiLink.href)).data;
  });
}

export default async function decorate(block) {
  const apis = [];
  const links = [];
  const cardInfos = Array(block.children.length).fill(null);

  [...block.children].forEach((row, idx) => {
    // card with content directly in the word document
    if (row.querySelector('picture')) {
      const thumbnail = row.querySelector('img');
      thumbnail.parentElement.parentElement.remove();

      const link = row.querySelector('a');
      link.parentElement.remove();

      cardInfos[idx] = {
        path: link.href,
        header: row.querySelector('h5')?.textContent,
        image: thumbnail.src,
        topic: row.querySelector('p')?.textContent,
      };

      return;
    }

    const source = row.querySelector('a');
    if (source) {
      // cards with content coming from a JSON api call
      if (isApiCall(source.href)) {
        apis.push({ href: source.href, idx });
      // card with content as a link only
      } else {
        links.push({ href: source.href, idx });
      }
    }
  });

  // extract information for the cards links and APIs
  await Promise.all([
    ...fetchLinkBasedCards(cardInfos, links),
    ...fetchAPIBasedCards(cardInfos, apis),
  ]);

  // render all cards
  block.innerHTML = '';
  cardInfos.forEach((cardInfo, idx) => {
    if (!cardInfo) return;

    if (Array.isArray(cardInfos[idx])) {
      block.append(...cardInfos[idx].map(renderCard));
    } else {
      block.append(renderCard(cardInfos[idx]));
    }
  });
}
