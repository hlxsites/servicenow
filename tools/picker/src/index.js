import React from 'react';
import * as ReactDOM from 'react-dom';

import Picker from './picker.js';

import './styles.css';

const pageURL = (path) => {
    return `https://main--aemeds--servicenow-martech.hlx.page${path}`;
}

const liveURL = (path) => {
    return `https://main--aemeds--servicenow-martech.hlx.page${path}`;
}

const LOCALES = [
    { display: 'US', key: 'en-US' },
    { display: 'UK', key: 'en-GB' },
    { display: 'DE', key: 'de-DE' },
    { display: 'FR', key: 'fr-FR' },
    { display: 'NL', key: 'nl-NL' },
];

const getItems = async (folderKey, page = 1) => {
    if (folderKey === 'Topics') {
        return getTopics();
    }

    if (folderKey === 'Categories') {
        return getCategories();
    }

    if (folderKey === 'Date Picker') {
        return [ { key: 'datepicker', name: 'Date Picker'}] ;
    }

    if (folderKey === 'Authors') {
        return LOCALES.map((locale) => ({
            key : `Authors/${locale.display}`,
            name: locale.display,
        }));
    }

    if (folderKey && folderKey.startsWith('Authors/')) {
        const localeDisplay = folderKey.split('/')[1];
        const locale = LOCALES.find((locale) => locale.display === localeDisplay);
        return getAuthors(locale?.key);
    }

    return [
        { key: 'Topics', name: 'Topics / New Trends' },
        { key: 'Categories', name: 'Categories' },
        { key: 'Date Picker', name: 'Date Picker' },
        { key: 'Authors', name: 'Authors' },
    ];
};

const getCategories = async () => {
    const resp = await fetch(liveURL('/blogs/tags.json?sheet=category'));
    if (resp.ok) {
        const json = await resp.json();
        return json.data.map( item => {
            return { key: 'category:' + item.identifier, name: item['en-US'] };
        })
    } else {
        return [ { key: 'error', name: 'Error loading Categories'}];
    }
}

const getTopics = async () => {
    const resp = await fetch(liveURL('/blogs/tags.json?sheet=topic'));
    if (resp.ok) {
        const json = await resp.json();
        return json.data.map( item => {
            return { key: 'topic:' + item.identifier, name: item['en-US'] };
        })
    } else {
        return [ { key: 'error', name: 'Error loading Topics'}];
    }
}

const getAuthors = async (locale) => {
    const resp = await fetch(liveURL('/blogs/query-index.json?sheet=authors&limit=5000'));
    if (resp.ok) {
        const json = await resp.json();
        return json.data
            .filter(item => item.locale === locale)
            .map(item => {
                return { key: `author:${item.header}::${pageURL(item.path)}`, name: item.header };
            });
    } else {
        return [ { key: 'error', name: 'Error loading Topics'}];
    }
}

const app = document.getElementById("app");
if (app) {
    ReactDOM.render(<Picker getItems={getItems}/>, app);
}
