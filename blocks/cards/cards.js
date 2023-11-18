import { createOptimizedPicture, readBlockConfig, toClassName } from '../../scripts/aem.js';
import { a, div, h5 } from '../../scripts/dom-helpers.js';
import {
  FILTERS, fetchAPI, getLocaleBlogs, getLocale, getTopicTags,
} from '../../scripts/scripts.js';

const TRENDS_AND_RESEARCH = toClassName('Trends and Research');

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

async function localizedTopic(topic) {
  if (!topic) return topic;
  const topicResponse = (await getTopicTags()).find((t) => t.identifier === topic);
  if (!topicResponse) return topic;
  return topicResponse[getLocale()] || topicResponse['en-US'] || topicResponse.identifier || topic;
}

export async function renderCard(post) {
  return (
    div({ class: 'card' },
      div({ class: 'card-thumbnail' },
        a({ href: post.path },
          createOptimizedPicture(post.image, post.header),
        ),
        post.topic ? div({ class: 'topic-tag' }, div(await localizedTopic(post.topic))) : '',
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

function homepageLatestRule(blogs, cardInfos, idx) {
  cardInfos[idx] = blogs.slice(0, 3);
}

function homepageCategoryRule(blogs, cardInfos, idx, config) {
  cardInfos[idx] = FILTERS.category(
    // skip first 3 blogs as they are used for the homepage latest rule
    blogs.slice(3),
    toClassName(config.category),
  ).slice(0, 3);
}

function sidebarFeaturedRule(blogs, cardInfos, idx) {
  const result = [];
  for (let i = 0; i < blogs.length; i += 1) {
    if (TRENDS_AND_RESEARCH === toClassName(blogs[i].trend)) {
      continue; // we keep these for the trends and research rule
    }
    result.push(blogs[i]);

    if (result.length === 3) {
      break;
    }
  }

  cardInfos[idx] = result;
}

function sidebarTrendsAndResearchRule(blogs, cardInfos, idx) {
  const result = [];
  for (let i = 0; i < blogs.length; i += 1) {
    if (TRENDS_AND_RESEARCH === toClassName(blogs[i].trend)) {
      result.push(blogs[i]);
    }

    if (result.length === 3) {
      break;
    }
  }

  cardInfos[idx] = result;
}

const RULES = {
  'home-page-latest': homepageLatestRule,
  'home-page-category': homepageCategoryRule,
  'sidebar-featured': sidebarFeaturedRule,
  'sidebar-trends-and-research': sidebarTrendsAndResearchRule,
}

async function fetchRuleBasedCards(config, cardInfos, idx) {
  const blogs = await getLocaleBlogs();
  const ruleHandler = RULES[toClassName(config.rule)];
  if (!ruleHandler) return; // unknown rule

  ruleHandler(blogs, cardInfos, idx, config);
}

export default async function decorate(block) {
  const apis = [];
  const links = [];
  const cardInfos = Array(block.children.length).fill(null);

  const config = readBlockConfig(block);

  // cards based on rules
  if (config.rule) {
    await fetchRuleBasedCards(config, cardInfos, 0);
  } else {
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
  }

  // render all cards
  block.innerHTML = '';

  await Promise.all(cardInfos.map(async (cardInfo, idx) => {
    if (!cardInfo) return;
    if (Array.isArray(cardInfos[idx])) {
      block.append(...await Promise.all(cardInfos[idx].map(renderCard)));
    } else {
      block.append(await renderCard(cardInfos[idx]));
    }
  }));
}
