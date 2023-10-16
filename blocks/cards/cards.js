import { createOptimizedPicture } from '../../scripts/aem.js';
import { a, div, h5 } from '../../scripts/dom-helpers.js';

async function fetchHtml(path) {
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

function renderCard(post) {
  return (
    div({ class: 'card' },
      div({ class: 'card-thumbnail' },
        a({ href: post.path },
          createOptimizedPicture(post.thumbnail, post.header),
        ),
        post.topic ? div({ class: 'topic-tag' }, div(post.topic)) : '',
      ),
      div({ class: 'card-text' },
        h5(post.header),
      ),
    )
  );
}

export default async function decorate(block) {
  const links = [];
  const cardInfos = Array(block.children.children).fill(null);

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
        thumbnail: thumbnail.src,
        topic: row.querySelector('p')?.textContent,
      };

      return;
    }

    // card with content as a link only
    if (row.querySelector('a')) {
      const link = row.querySelector('a');
      links.push({ href: link.href, idx });
    }
  });

  // extract information for the cards as link only
  await Promise.all(links.map(async (postLink) => {
    const fragmentHtml = await fetchHtml(postLink.href, false);
    if (fragmentHtml) {
      const fragmentElement = div();
      fragmentElement.innerHTML = fragmentHtml;

      const header = fragmentElement.querySelector('h1').textContent;
      const thumbnail = fragmentElement.querySelector('img')
        .getAttribute('src');
      const topic = fragmentElement.querySelector('meta[name="topic"]')
        .getAttribute('content');

      cardInfos[postLink.idx] = {
        path: postLink.href,
        header,
        thumbnail,
        topic,
      };
    }
  }));

  // render all cards
  cardInfos.forEach((cardInfo, idx) => {
    if (!cardInfo) return;

    block.children[idx].replaceWith(
      renderCard(cardInfos[idx], idx),
    );
  });
}
