/* eslint-disable max-len */
import { createOptimizedPicture, readBlockConfig, toClassName } from '../../scripts/aem.js';
import { a, div, h5 } from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';
import {
  BLOG_FILTERS,
  fetchAPI,
  getLocale,
  getTopicTags,
  getTemplate,
  BLOG_QUERY_INDEX,
  analyticsGlobalClickTrack,
  analyticsCanonicStr,
} from '../../scripts/scripts.js';

const TRENDS_AND_RESEARCH = toClassName('Trends and Research');
const RESEARCH_CATEGORY = toClassName('ServiceNow Research');
const PLACEHOLDER_IMAGE = '/blogs/assets/servicenow-placeholder.png';

async function waitForEagerImageLoad(img) {
  if (!img) return;

  await new Promise((resolve) => {
    if (img && !img.complete) {
      img.setAttribute('loading', 'eager');
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
    } else {
      resolve();
    }
  });
}

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

function closestH3(card) {
  try {
    const h3s = [
      ...card.parentElement // cards
        .parentElement // cards-wrapper
        .previousElementSibling // default-content-wrapper
        .querySelectorAll('h3'), // get all h3s
    ];
    return h3s.pop()?.textContent;
  } catch (err) {
    // don't fail
  }

  return '';
}

function clickTrack(card) {
  card.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const section = analyticsCanonicStr(
        closestH3(card) || document.querySelector('h1')?.textContent,
      );
      const cardTitle = analyticsCanonicStr(card.querySelector('h5')?.textContent);
      const eVar22 = `${section}:${cardTitle}`;

      analyticsGlobalClickTrack({
        event: {
          pageArea: 'body',
          eVar22,
          click: {
            componentName: 'cards',
            destination: link.href,
            pageArea: 'body',
            ctaText: cardTitle,
            section,
          },
        },
      }, e);
    });
  });

  return card;
}

function isNotEmpty(field) {
  return field && field !== '0' && field !== '#N/A';
}

export async function renderCard(post, renderTopic = true) {
  return (
    div({ class: 'card' },
      div({ class: 'card-thumbnail' },
        a({ href: post.path },
          isNotEmpty(post.image)
            ? createOptimizedPicture(new URL(post.image, window.origin).toString(), post.header)
            : createOptimizedPicture(new URL(PLACEHOLDER_IMAGE, window.origin).toString(), post.header),
        ),
        renderTopic && post.topic ? div({ class: 'topic-tag' }, div(await localizedTopic(post.topic))) : '',
      ),
      div({ class: 'card-text' },
        a({ href: post.path },
          h5(post.header),
        ),
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

async function homepageLatestRule(blogs, cardInfos, idx) {
  cardInfos[idx] = await blogs
    .filter(BLOG_FILTERS.locale)
    .filter((blog) => !BLOG_FILTERS.category(RESEARCH_CATEGORY, blog))
    .limit(3)
    .all();
}

async function homepageCategoryRule(blogs, cardInfos, idx, config) {
  const latestLinks = [...document.querySelectorAll('.home-page-latest a')]
    .map((link) => new URL(link.href).pathname);

  cardInfos[idx] = await blogs
    .filter(BLOG_FILTERS.locale)
    .filter((blog) => BLOG_FILTERS.category(toClassName(config.category), blog)
      && !latestLinks.includes(blog.path))
    .limit(3)
    .all();
}

async function sidebarFeaturedRule(blogs, cardInfos, idx) {
  cardInfos[idx] = await blogs
    .filter(BLOG_FILTERS.locale)
    .filter((blog) => !BLOG_FILTERS.trend(TRENDS_AND_RESEARCH, blog))
    .filter((blog) => blog.path !== window.location.pathname)
    .limit(3)
    .all();
}

async function sidebarTrendsAndResearchRule(blogs, cardInfos, idx) {
  cardInfos[idx] = await blogs.filter(BLOG_FILTERS.locale)
    .filter((blog) => BLOG_FILTERS.trend(TRENDS_AND_RESEARCH, blog))
    .filter((blog) => blog.path !== window.location.pathname)
    .limit(3)
    .all();
}

const RULES = {
  'home-page-latest': homepageLatestRule,
  'home-page-category': homepageCategoryRule,
  'sidebar-featured': sidebarFeaturedRule,
  'sidebar-trends-and-research': sidebarTrendsAndResearchRule,
};

async function fetchRuleBasedCards(config, cardInfos, idx, block) {
  const blogs = ffetch(BLOG_QUERY_INDEX)
    .chunks(250)
    .sheet('blogs');

  const ruleName = toClassName(config.rule);
  const ruleHandler = RULES[ruleName];
  if (!ruleHandler) return; // unknown rule
  block.classList.add(ruleName);

  await ruleHandler(blogs, cardInfos, idx, config);
}

let waitedForLCP = false;
async function optimiseLCP(block) {
  if (waitedForLCP) return;

  const template = getTemplate();
  if (template && template === 'blog-home-page' && block.classList.contains('teaser')) {
    waitedForLCP = true;
    await waitForEagerImageLoad(block.querySelector('img'));
  }
}

export default async function decorate(block) {
  const apis = [];
  const links = [];
  const cardInfos = Array(block.children.length).fill(null);

  const config = readBlockConfig(block);

  // cards based on rules
  if (config.rule) {
    await fetchRuleBasedCards(config, cardInfos, 0, block);
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
      const cards = await Promise.all(cardInfos[idx].map((card) => renderCard(card)));

      block.append(...cards.map(clickTrack));
    } else {
      const card = await renderCard(cardInfos[idx]);
      block.append(clickTrack(card));
    }
  }));

  await optimiseLCP(block);
}
