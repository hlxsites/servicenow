/**
 * @jest-environment jsdom
 * @jest-environment-options {"runScripts": "dangerously"}
 */

import fs from 'fs';
import fetchMock from 'jest-fetch-mock';
import { loadHTML, getPath } from '../utils.js';
import { loadPage } from '../../scripts/scripts.js';

beforeAll(() => {
  fetchMock.mockIf(/^.*$/, (req) => {
    switch (true) {
      case req.url.endsWith('/3-ways-enhance-digital-experiences-html'):
        // http://localhost/blogs/2023/demo/3-ways-enhance-digital-experiences-html
        return Promise.resolve(`
        <html lang="en">
          <head>
            <title>Quickly Get Started with Generative AI</title>
            <meta name="topic" content="AI and Automation">
          </head>
          <body>
            <header></header>
            <main>
              <div>
                <h1 id="ways-to-enhance-digital-experiences-and-productivity">3 ways to enhance digital experiences and productivity</h1>
                <p>
                  <picture>
                    <source type="image/webp" srcset="./media_1823f5acf4bff690ee74728ab2e7ccc741a17800f.jpeg?width=2000&#x26;format=webply&#x26;optimize=medium" media="(min-width: 600px)">
                    <img loading="lazy" alt="Get started with generative AI: group of workers in discussion around a conference table" src="./media_1823f5acf4bff690ee74728ab2e7ccc741a17800f.jpeg?width=750&#x26;format=jpeg&#x26;optimize=medium" width="788" height="443">
                  </picture>
                </p>
              </div>
            </main>
          </body>
        </html>
        `);
      case req.url.endsWith('/sidebar-fragment.plain.html'):
        // fetch /blogs/fragments/sidebar-fragment.plain.html
        return Promise.resolve(`<div>
            <h3 id="featured">Featured</h3>
            <div class="cards sidebar">
              <div>
                <div><a href="/blogs/2023/demo/3-ways-enhance-digital-experiences-html">https://main--servicenow--hlxsites.hlx.live/blogs/2023/demo/3-ways-enhance-digital-experiences-html</a></div>
              </div>
            </div>
          </div>
        `);
      case req.url.endsWith('/nav.plain.html'):
        // fetch /nav.plain.html
        return Promise.resolve('<div>hello nav</div>');
      case req.url.endsWith('/footer.plain.html'):
        // fetch /nav.plain.html
        return Promise.resolve('<div>hello footer</div>');
      default:
        return Promise.resolve({
          status: 200,
          body: '<div>hello world</div>',
        });
    }
  });
});

describe('aem test demo', () => {
  test('simple aem test', async () => {
    const document = await loadHTML(getPath(import.meta.url, './testdata/article.html'));
    await loadPage(document);
    fs.writeFileSync(getPath(import.meta.url, '../tmp/article-output.html'), document.documentElement.outerHTML);
    const fragmentCss = document.head.querySelector('link[rel="stylesheet"][href="../blocks/fragment/fragment.css"]');
    expect(fragmentCss).not.toBeNull();
    const featuredH3 = document.querySelector('h3#featured');
    expect(featuredH3).not.toBeNull();
  });
});
