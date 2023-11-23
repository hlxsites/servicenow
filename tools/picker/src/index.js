import React from 'react';
import * as ReactDOM from 'react-dom';

import Picker from './picker.js';

import './styles.css';

const getItems = async (folderKey, page = 1) => {
    if (folderKey === 'Topics') {
        return getTopics();
    }

    if (folderKey === 'Categories') {
        return getCategories();
    }

    if (folderKey === 'Date Picker') {
        return [ { key: 'datepicker', name: 'Date Picker'}];
    }

    return [
        { key: 'Topics', name: 'Topics' },
        { key: 'Categories', name: 'Categories' },
        { key: 'Date Picker', name: 'Date Picker' },
    ];
};

const getCategories = async () => {
    const resp = await fetch('https://main--servicenow--hlxsites.hlx.live/blogs/tags.json?sheet=category');
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
    const resp = await fetch('https://main--servicenow--hlxsites.hlx.live/blogs/tags.json?sheet=topic');
    if (resp.ok) {
        const json = await resp.json();
        return json.data.map( item => {
            return { key: 'topic:' + item.identifier, name: item['en-US'] };
        })
    } else {
        return [ { key: 'error', name: 'Error loading Topics'}];
    }
}

const app = document.getElementById("app");
if (app) {
    ReactDOM.render(<Picker getItems={getItems}/>, app);
}
