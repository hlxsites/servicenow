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

const pageUrl = "https://main--servicenow--hlxsites.hlx.page";
const liveUrl = "https://main--servicenow--hlxsites.hlx.page";

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
    const tagsURL = 'https://main--servicenow--hlxsites.hlx.live/blogs/tags.json';
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

const createMetadataBlock = (main, document, url) => {
    const jsonRendition = JSON.parse(fetchSync('GET', jsonRenditionURL(url)).body);
    const allTags = getAllTags();
    const originalTags = getOriginalTags(jsonRendition);

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
        meta.Title = title.textContent.replace(/[\n\t]/gm, '');
    }

    // Description
    const desc = document.querySelector('[property="og:description"]');
    if (desc) {
        meta.Description = desc.content;
    }

    // Publication Date
    const date = document.querySelector('.cmp-blog-author-info__date');
    if (date) {
        const dateStr = date.textContent.trim();
        const dateObj = new Date(dateStr);
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

export default {
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

        main.querySelectorAll('.legacyHTML, .servicenow-blog-header, .blog-author-info, .component-tag-path, .aem-GridColumn--default--4, .hero-image').forEach(el => el.remove());
        
        // TODO is this ok?
        main.querySelectorAll('br, nbsp').forEach((el) => el.remove());

        // Remove copyright as we create a fragment with it.
        main.querySelectorAll('p').forEach((paragraph) => {
            if (paragraph.textContent.includes('ServiceNow, Inc. All rights reserved.')) {
                paragraph.remove();
            }
        })
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