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

const createMetadataBlock = (main, document) => {
    const meta = {};

    // Author
    const authorLink = document.querySelector('.cmp-blog-author-info__author a');
    if (authorLink) {
        meta.Author = authorLink.textContent;
        meta['Author Link'] = authorLink.href;
    }

    // Publication Date
    const date = document.querySelector('.cmp-blog-author-info__date');
    if (date) {
        const dateStr = date.textContent.trim();
        const dateObj = new Date(dateStr);
        // format date to mm/dd/yyyy
        meta['Publication Date'] = dateObj.toLocaleDateString('en-US');
    }

    // Title
    const title = document.querySelector('title');
    if (title) {
        meta.Title = title.textContent.replace(/[\n\t]/gm, '');
    }

    // Keywords
    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords && keywords.content) {
        meta.Keywords = keywords.content;
    }

    // Description
    const desc = document.querySelector('[property="og:description"]');
    if (desc) {
        meta.Description = desc.content;
    }

    // Template
    meta.Template = 'Blog Article';

    // Category
    const tags = document.querySelectorAll('.cmp-blog-author-info__tags li');
    if (tags) {
        // for each tag, if present in a predefined list, then add it to the metadata
        const topics = ['AI and Automation', 
                        'Application Development',
                        'Careers',
                        'Crisis Management',
                        'Culture',
                        'Customer Experience',
                        'Customer Stories',
                        'Cybersecurity and Risk',
                        'Education',
                        'Employee Experience',
                        'Events',
                        'Financial Services',
                        'Government',
                        'Healthcare',
                        'IT Management',
                        'Manufacturing',
                        'Now on Now',
                        'Now Platform',
                        'Telecommunications',

                        // de-DE
                        'Application Development',
                        'Behörden',
                        'Bildungswesen',
                        'Crisis Management',
                        'Cybersicherheit und Risikomanagement',
                        'Events',
                        'Fertigungsindustrie',
                        'Finanzindustrie',
                        'Gesundheitswesen',
                        'IT-Management',
                        'Karriere',
                        'KI und Automatisierung',
                        'Kultur',
                        'Kunden-Experience',
                        'Kundengeschichten',
                        'Mitarbeiter-Experience',
                        'Now on Now',
                        'Now Platform',
                        'Telekommunikation',

                        // fr-FR
                        'Carrières',
                        'Culture',
                        'Cyber-sécurité et risques',
                        'Développement d’applications',
                        'Expérience client',
                        'Expérience des employés',
                        'Gestion de crise',
                        'Gestion de l’IT',
                        'Gouvernement',
                        'IA et automatisation',
                        'Now on Now',
                        'Now Platform',
                        'Production industrielle',
                        'Santé',
                        'Services financiers',
                        'Télécommunications',
                        'Témoignages Client',
                        'Éducation',
                        'Événements',
                        // nl-NL
                        'AI en automatisering',
                        'Applicatieontwikkeling',
                        'Carrière',
                        'Crisismanagement',
                        'Cultuur',
                        'Cybersecurity and Risk',
                        'Events',
                        'Financiële dienstverlening',
                        'Gezondheidszorg',
                        'IT-beheer',
                        'Klantervaring',
                        'Klantverhalen',
                        'Now on Now',
                        'Now Platform',
                        'Opleiding',
                        'Overheid',
                        'Productie',
                        'Telecommunicatie',
                        'Werknemerservaring'
            
        ];

        const categories = ['Trends and Research', 'About ServiceNow', 'Solutions', 'Life at Now'];

        // for each tag if present in the topics array, then create a list of topics

        for (let i = 0; i < tags.length; i++) {
            if (categories.includes(tags[i].textContent.trim())) {
                if (meta.Category) {
                    meta.Category = meta.Category + ', ' + tags[i].textContent.trim();
                }
                else {
                    meta.Category = tags[i].textContent.trim();
                }
            }

            if (topics.includes(tags[i].textContent.trim())) {
                meta.Topic = tags[i].textContent.trim();
            }

        }
    }

    // Image
    const img = document.querySelector('[property="og:image"]');
    if (img && img.content) {
        const el = document.createElement('img');
        el.src = img.content;
        meta.Image = el;
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

        createMetadataBlock(main, document);

        main.querySelectorAll('.legacyHtml, .servicenow-blog-header, .blog-author-info, .component-tag-path, .aem-GridColumn--default--4').forEach(el => el.remove());
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