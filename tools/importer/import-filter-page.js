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

function jsonRenditionURL(url, depth = 1) {
    return url.replace('.html', `.${depth}.json`);
}

function getAllTags() {
    const tagsURL = 'https://main--servicenow--hlxsites.hlx.live/drafts/import/tags.json';
    const response = fetchSync('GET', tagsURL);
    if (response.status === 200) {
        return JSON.parse(response.body);
    }
    return {};
}

const createMetadataBlock = (main, document, url) => {
    const meta = {};

    // Title
    const title = document.querySelector('title');
    if (title) {
        let titleText = title.textContent.replace(/[\n\t]/gm, '').trim();
        const suffix = ' - ServiceNow Blog';
        if (titleText.endsWith(suffix)) {
            titleText = titleText.substring(0, titleText.length - suffix.length);
        }
        meta.Title = titleText;
    }

    // Description
    const desc = document.querySelector('[property="og:description"]');
    if (desc && desc.content.trim()) {
        meta.Description = desc.content.trim();
    } else {
        meta.Description = 'Read about ServiceNow\'s Company News, Announcements, and Updates.';
    }

    // Keywords
    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords && keywords.content) {
        meta.Keywords = keywords.content;
    }

    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(block);

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

        // CLEANUP
        main.querySelectorAll('.legacyHTML, .servicenow-blog-header, .blog-author-info, .component-tag-path, .aem-GridColumn--default--4, .hero-image').forEach(el => el.remove());
        // TODO is this ok?
        main.querySelectorAll('br, nbsp').forEach((el) => el.remove());
        main.querySelectorAll('img[src^="/akam/13/pixel"]').forEach((el) => el.remove());
        main.querySelectorAll('.servicenow-blog-list--block, .cmp-list').forEach((el) => el.remove());

        main.append(document.createElement('hr')); // create section

        const jsonRendition = JSON.parse(fetchSync('GET', jsonRenditionURL(url, 5)).body);
        const listTag = jsonRendition['jcr:content']?.root?.responsivegrid?.responsivegrid?.list?.tags[0]?.trim();

        const allTags = getAllTags();
        let blogList = null;
        if (url.toString().includes('/topics/')) {
            console.log('here');
            // topic page
            const newTredTag = allTags.topic.data.find((tag) => tag['legacy-identifier-newtrend'] === listTag)?.identifier;
            blogList = WebImporter.DOMUtils.createTable([['Blog List'], ['New Trend', newTredTag]], document);
        } else if (url.toString().includes('/category/')) {
            // category page
            const categoryTag = allTags.category.data.find((tag) => tag['legacy-identifier'] === listTag)?.identifier;
            blogList = WebImporter.DOMUtils.createTable([['Blog List'], ['Category', categoryTag]], document);
        } else if (params.originalURL.match(/\b\d{4}\.html$/)){
            const urlParts = params.originalURL.replace('.html', '').split('/');
            const year = urlParts[urlParts.length - 1];
            // year page
            blogList = WebImporter.DOMUtils.createTable([['Blog List'], ['Year', year]], document);
        }

        // TODO author

        if (blogList) {
            main.append(blogList);
        }
        
        createMetadataBlock(main, document, url);
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