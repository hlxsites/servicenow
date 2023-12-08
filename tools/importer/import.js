/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const pageUrl = "https://main--aemeds--servicenow-martech.hlx.page";
const liveUrl = "https://main--aemeds--servicenow-martech.hlx.live";
const servicenowUrl = 'https://www.servicenow.com';

function fetchSync(method, url) {
    // we use old XMLHttpRequest as fetch seams to have problems in bulk import
    const request = new XMLHttpRequest();
    request.open(method, url, false);
    request.overrideMimeType('text/json; UTF-8');
    request.send(null);
    return {
        status: request.status,
        body: request.responseText,
    }
}

function jsonRenditionURL(url) {
    return url.replace('.html', '.1.json');
}

function getAllTags() {
    const tagsURL = 'https://main--servicenow--hlxsites.hlx.live/drafts/import/tags.json';
    const response = fetchSync('GET', tagsURL);
    if (response.status === 200) {
        return JSON.parse(response.body);
    }
    return {};
}

function getOriginalTags(jsonRendition) {
    return jsonRendition['jcr:content']['cq:tags'];
}

function getOriginalCategoryTag(originalTags) {
    return originalTags.find((tag) => tag.startsWith('sn-blog-docs:category'));
}

function getOriginalTopicTag(originalTags) {
    return originalTags.find((tag) => tag.startsWith('sn-blog-docs:topic'));
}

function getOriginalNewTrendTag(originalTags) {
    return originalTags.find((tag) => tag.startsWith('sn-blog-docs:new-trend'));
}

function isServiceNowLink(link) {
    // we don't want to overwrite subdomains, so we use strict host check
    // see https://github.com/hlxsites/servicenow/issues/124
    return (link.host.startsWith('localhost')
        || link.host === 'www.servicenow.com'
        || link.host === 'servicenow.com');
}

function isBlogLink(link) {
    return isServiceNowLink(link) &&
        (link.pathname.startsWith('/blogs')
        || link.pathname.startsWith('/fr/blogs')
        || link.pathname.startsWith('/de/blogs')
        || link.pathname.startsWith('/uk/blogs')
        || link.pathname.startsWith('/nk/blogs'));
}

function getServiceNowUrl(link) {
    return new URL(new URL(link.href).pathname, servicenowUrl);
}

function getPageUrl(link) {
    return new URL(new URL(link.href).pathname.replace('.html', ''), pageUrl);
}

const createMetadataBlock = (main, document, url) => {
    const jsonRendition = JSON.parse(fetchSync('GET', jsonRenditionURL(url)).body);
    const allTags = getAllTags();
    const originalTags = getOriginalTags(jsonRendition) || [];

    const originalCategoryTag = getOriginalCategoryTag(originalTags);
    const originalTopicTag = getOriginalTopicTag(originalTags);
    const originalNewTrendTag = getOriginalNewTrendTag(originalTags);

    const meta = {};

    // Author
    const authorLink = document.querySelector('.cmp-blog-author-info__author a');
    if (authorLink) {
        meta.Author = authorLink.textContent;

        // TODO whether we remove .html might depend on the outcome of https://github.com/hlxsites/servicenow/issues/24
        meta['Author Link'] = new URL(new URL(authorLink.href.replace('.html', '')).pathname, pageUrl);
    }

    // Category
    meta.Category = allTags.category.data.find((tag) => tag['legacy-identifier'] === originalCategoryTag)?.identifier;

    // Topic
    meta.Topic = allTags.topic.data.find((tag) => tag['legacy-identifier-topic'] === originalTopicTag)?.identifier;

    const newTredTag = allTags.topic.data.find((tag) => tag['legacy-identifier-newtrend'] === originalNewTrendTag)?.identifier;
    if (newTredTag) {
        meta['New Trend'] = newTredTag;
    }

    if (originalTags.includes('sn-blog-docs:trend/trends-research')) {
        meta['Trend'] = 'Trends and Research';
    }

    // This comes from the bulk metadata for Blog articles
    // meta.Template = 'Blog Article';


    // Title
    const title = document.querySelector('title');
    if (title) {
        let titleText = title.textContent.replace(/[\n\t]/gm, '').trim();
        const suffix = 'ServiceNow Blog';
        if (titleText.endsWith(suffix)) {
            titleText = titleText.substring(0, titleText.length - (suffix.length + 3)).trim();
        }
        meta.Title = titleText;
    }

    // Description
    const desc = document.querySelector('[property="og:description"]');
    if (desc && desc.content.trim()) {
        meta.Description = desc.content.trim();
    }

    // Publication Date
    const date = document.querySelector('.cmp-blog-author-info__date');
    if (date) {
        const dateObj = new Date(jsonRendition['jcr:content'].date);
        // format date to mm/dd/yyyy
        meta['Publication Date'] = dateObj.toLocaleDateString(
            'en-US',
            { day: '2-digit', month: '2-digit', year: 'numeric' },
        );
    }

    // Keywords
    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords && keywords.content) {
        meta.Keywords = keywords.content;
    }

    // Template set in the metadata.xls
    // meta.Template = 'Blog Article';

    // Image - TODO if we find blogs for which the first image is not the same as the og:image
    // const img = document.querySelector('[property="og:image"]');
    // if (img && img.content) {
    //     const el = document.createElement('img');
    //     el.src = img.content;
    //     meta.Image = el;
    // }

    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.prepend(block);

    return meta;
};

const h3ConvertExceptions = [
    'https://www.servicenow.com/blogs/2022/nvidia-gtc-22-leaders-ai-panel-q-and-a.html',
    'https://www.servicenow.com/blogs/2022/knowledge-2022-social-media-contest-rules.html',
];

export default {
    onLoad: async ({ document, url, params }) => {
        [...document.querySelectorAll('p')].forEach((paragraph) => {
            if (paragraph.querySelector('br') && paragraph.innerHTML.trim().endsWith('&nbsp;')) {
                paragraph.dataset.endsWithNBSPPresent = true;
            }
        });

      },

    /**
     * Apply DOM operations to the provided document and return
     * the root element to be then transformed to Markdown.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @returns {HTMLElement} The root element to be transformed
     */
    transformDOM: ({
                       // eslint-disable-next-line no-unused-vars
                       document, url, html, params,
                   }) => {

        const main = document.querySelector('body');

        createMetadataBlock(main, document, url);

        // CLEANUP
        main.querySelectorAll('.legacyHTML, .social-sharing, .servicenow-blog-header, .blog-author-info, .component-tag-path, .aem-GridColumn--default--4').forEach(el => el.remove());
        // TODO is this ok?
        main.querySelectorAll('img[src^="/akam/13/pixel"], noscript').forEach((el) => el.remove());
        // Remove copyright as we create a fragment with it.
        main.querySelectorAll('p').forEach((paragraph) => {
            if (paragraph.textContent.includes('ServiceNow, Inc. All rights reserved.')) {
                paragraph.remove();
            }

            if (paragraph.textContent.includes('ServiceNow, the ServiceNow logo, Now, and other ServiceNow marks are trademarks')) {
                paragraph.remove();
            }

            if (paragraph.textContent.includes('ServiceNow, Inc. Alle Rechte vorbehalten. ServiceNow, das ServiceNow-Logo, Now und andere Marken')) {
                paragraph.remove();
            }
        })

        // Processing Links
        main.querySelectorAll('a').forEach((link) => {
            if (isServiceNowLink(link)) {
                if (isBlogLink(link)) {
                    link.href = getPageUrl(link);
                } else {
                    link.href = getServiceNowUrl(link);
                }
            }
        });

        main.querySelectorAll('a img, a picture').forEach((image) => {
            const link = image.closest('a');
            link.parentElement.before(image);
            if (link.textContent.trim() === '') {
              link.textContent = link.href;
            }
        });

        // Brightcove videos
        main.querySelectorAll('.brightcove-video-wrapper video').forEach((brightcoveVideo) => {
            const defaultBCAccountId = '5703385908001';
            const defaultBCPlayer = 'default';

            const brightcoveRows = [['Embed (Brightcove)'], ['VideoID', brightcoveVideo.dataset.videoId]];
            if (brightcoveVideo.dataset.account !== defaultBCAccountId) {
                brightcoveRows.push(['Account', brightcoveVideo.dataset.account]);
            }
            if (brightcoveVideo.dataset.player !== defaultBCPlayer) {
                brightcoveRows.push(['Player', brightcoveVideo.dataset.player]);
            }
            brightcoveVideo.replaceWith(WebImporter.DOMUtils.createTable(brightcoveRows, document));
        });

        // Youtube Videos
        main.querySelectorAll('.comp-youtube-video iframe').forEach((youtubeIframe) => {
            const youtubeLink = document.createElement('a');
            youtubeLink.href = youtubeIframe.src;
            youtubeLink.textContent = youtubeIframe.src;
            youtubeIframe.replaceWith(WebImporter.DOMUtils.createTable([['Embed'], [ youtubeLink ]], document));
        });

        if (!h3ConvertExceptions.includes(params.originalURL)) {
            // Replace legacy standlone bold elements with h3s
            main.querySelectorAll('strong, b').forEach((bold) => {
                if (bold.textContent.trim() === bold.parentElement.textContent.trim()
                    && (bold.textContent.length < 100)
                    && !bold.textContent.startsWith('Click')
                    && !bold.closest('ul')
                    && !bold.closest('ol')
                ) {
                    const h3 = document.createElement('h3');
                    h3.textContent = bold.textContent;
                    bold.parentElement.replaceWith(h3);
                }

                if (((bold.nextSibling && bold.nextSibling.tagName === 'BR') || bold.innerHTML.trim().endsWith('<br>')) && bold.textContent.length < 100) {
                    const h3 = document.createElement('h3');
                    h3.textContent = bold.textContent;
                    
                    const parent = bold.parentElement;
                    bold.remove();
                    parent.before(h3);
                }
            });



            main.querySelectorAll('h6').forEach((h6) => {
                const h3 = document.createElement('h3');
                h3.textContent = h6.textContent;
                h6.replaceWith(h3);
            });
        } else {
            console.log('Skipping h3 conversion for URL', params.originalURL)
        }

        let edited;
        do {
            edited = false;
            const BRs = [...main.querySelectorAll('br')];
            for (let i = 0; i < BRs.length; i++) {
                const br = BRs[i];
                const parent = br.parentElement;
                if (!parent) return;

                // used in https://www.servicenow.com/blogs/2022/data-augmentation-intent-classification.html
                if (parent.previousElementSibling
                    && parent.innerHTML.trim().startsWith('<br>\n<sup>')
                    && parent.previousElementSibling.tagName === 'P') {

                    while(parent.querySelector('br:last-child')) {
                        parent.querySelector('br:last-child').remove();
                    }

                    parent.previousElementSibling.innerHTML += '\n<br>\n' + parent.innerHTML;
                    parent.remove();
                    edited = true;
                    break;
                }

                if (parent.nextElementSibling
                    && parent.tagName !== 'H3'
                    && parent.innerHTML.trim().endsWith('<br>')
                    && parent.nextElementSibling.tagName === 'P') {
                    if (parent.dataset.endsWithNBSPPresent) {
                        parent.innerHTML += '\n<br>';
                    }
                    
                    parent.innerHTML += '\n' + parent.nextElementSibling.innerHTML;
                    parent.nextElementSibling.remove();
                    edited = true;
                    break;
                }
            };
        } while(edited);

        return main;
    },

    /**
     * Return a path that describes the document being transformed (file name, nesting...).
     * The path is then used to create the corresponding Word document.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @return {string} The path
     */
    generateDocumentPath: ({
                               // eslint-disable-next-line no-unused-vars
                               document, url, html, params,
                           }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
};