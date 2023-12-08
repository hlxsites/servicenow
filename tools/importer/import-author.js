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
const servicenowUrl = 'https://www.servicenow.com';

function isServiceNowLink(link) {
    return (link.host.startsWith('localhost') || link.host.endsWith('servicenow.com'));
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
    return new URL(new URL(link).pathname.replace('.html', ''), pageUrl);
}

const createMetadataBlock = (main, document, url) => {

    const meta = {};

    // Title
    const title = document.querySelector('title');
    if (title) {
        let titleText = title.textContent.replace(/[\n\t]/gm, '').trim();
        const suffix = 'ServiceNow Blog';
        if (titleText.endsWith(suffix)) {
            titleText = titleText.substring(0, titleText.length - (suffix.length + 3)).trim();
        }
        console.log(titleText);
        meta.Title = titleText;
    }

    // Description
    const desc = document.querySelector('[property="og:description"]');
    if (desc && desc.content.trim()) {
        meta.Description = desc.content.trim();
    }

    // Keywords
    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords && keywords.content) {
        meta.Keywords = keywords.content;
    }

    const author = document.querySelector('[property="og:url"]');
    var authorUrl = '';

    if (author && author.content.trim()) {
        authorUrl = author.content.trim();
    }

    let authorPicture = document.querySelector('.image img');
    if (!authorPicture) {
        authorPicture = document.createElement('img');
        authorPicture.src = '/blogs/author/servicenow-blog/_jcr_content/root/responsivegrid/responsivegrid/responsivegrid_387144068/image.coreimg.png/1619481053507/servicenow-blog.png';
    }

    let authorDescription = document.querySelectorAll('.text p');
    if (authorDescription.length === 0 && document.querySelector('.cmp-text')) {
        const paragraph = document.createElement('p');
        paragraph.textContent = document.querySelector('.cmp-text').textContent;
        document.querySelector('.cmp-text').remove();
        authorDescription = [ paragraph ];
    }

    const authorColumns = WebImporter.DOMUtils.createTable([
        ['Columns (Blog Authors)'], 
        [ authorPicture, [...authorDescription]]
    ], document);
    main.append(authorColumns);

    // insert new hr element as last element of main
    const hr = document.createElement('hr');
    main.append(hr);

    const blogList = WebImporter.DOMUtils.createTable([['Blog List'], ['Author ', getPageUrl(authorUrl)]], document);
    const metadataBlock = WebImporter.Blocks.getMetadataBlock(document, meta);

    main.append(blogList);
    main.append(metadataBlock);

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

        console.debug(url);

        createMetadataBlock(main, document, url);

        // CLEANUP
        main.querySelectorAll('.legacyHTML, .servicenow-blog-header, .blog-author-info, .component-tag-path, .aem-GridColumn--default--4, .hero-image, .com-seperator, .servicenow-blog-list--block').forEach(el => el.remove());

        main.querySelectorAll('br, nbsp').forEach((el) => el.remove());
        main.querySelectorAll('img[src^="/akam/13/pixel"], noscript').forEach((el) => el.remove());


        // Processing...
        main.querySelectorAll('a').forEach((link) => {
            if (isServiceNowLink(link)) {
                if (isBlogLink(link)) {
                    link.href = getPageUrl(link);
                } else {
                    link.href = getServiceNowUrl(link);
                }
            }
        });

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