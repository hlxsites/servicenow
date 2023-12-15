import React, { useEffect, useState } from 'react';

import {
    defaultTheme,
    Provider,
    ListView,
    Item,
    Text,
    Heading,
    Breadcrumbs,
    ActionButton,
    Flex,
    IllustratedMessage,
    Calendar
} from '@adobe/react-spectrum';
import Folder from '@spectrum-icons/illustrations/Folder';
import NotFound from '@spectrum-icons/illustrations/NotFound';
import Copy from '@spectrum-icons/workflow/Copy';

const Picker = props => {
    const { getItems } = props;

    const [state, setState] = useState({
        items: {},
        typeDisplayed: 0,
        path: [],
        loadingState: 'loading',
    });

    const clickListItem = (key) => {
        console.log(key);
        if (key.includes(':')) {
            copyToClipboard(key);
            return;
        }
        selectFolder(key);
    }

    const selectFolder = (key) => {
        setState(state => ({
            ...state,
            typeDisplayed: key,
            loadingState: 'loading',
        }));
    };

    const copyToClipboard = key => {
        if (!key) return;

        if (key.startsWith('author:')) {
            let author = key.slice(key.indexOf(':') + 1)
            const [authorName, authorLink] = author.split('::');
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([ 
                        `<table>
                            <tr>
                                <td>${authorName}</td>
                            </tr>
                            <tr>
                                <td>${authorLink}</td>
                            </tr>
                        </table>` 
                    ], { type: 'text/html' }),
                }),
            ]);
        } else { 
            let item = key.slice(key.indexOf(':') + 1)
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([ item ], { type: 'text/plain' }),
                }),
            ]);
        }
    };

    const onDateChange = (date) => {
        copyToClipboard(`${date.month}/${date.day}/${date.year}`)
    }

    const getPath = () => {
        if (state.typeDisplayed == 0) {
            return [];
        }
        return [ { key: 0, name: "Back"}, { key: state.typeDisplayed, name: state.typeDisplayed }];
    }

    const renderEmptyState = () => (
        <IllustratedMessage>
            <NotFound />
            <Heading>No items found</Heading>
        </IllustratedMessage>
    );

    const onLoadMore = async () => {
        if (state.loadingState === 'idle') {
            return;
        }

        setState(state => ({
            ...state,
            loadingState: 'loading',
        }));

        const items = await getItems(state.typeDisplayed);
        setState(state => {
            const newItems = {...state.items, ...items};
            return {
                ...state,
                items: newItems,
                loadingState: 'idle',
            }
        });
    }

    useEffect(() => {
        (async () => {
            let items = await getItems(0);

            const path = getPath();

            setState(state => {
                return {
                    ...state,
                    items,
                    path,
                }
            });
        })();
    }, []);


    useEffect(() => {
        (async () => {
            let items = await getItems(state.typeDisplayed);

            setState(state => {
                const path = getPath();

                return {
                    ...state,
                    items,
                    path,
                    loadingState: 'idle',
                }
            });
        })();
    }, [state.typeDisplayed]);

    const items = Object.values(state.items);

    return <Provider theme={defaultTheme} height="100%">
        <Flex direction="column" height="100%">
            <Breadcrumbs onAction={(key) => selectFolder(key)}>
                {state.path.map(c => <Item key={c.key}>{c.name}</Item>)}
            </Breadcrumbs>
            <ListView aria-label="List of Items"
                items={items}
                loadingState={state.loadingState}
                width="100%"
                height="100%"
                density="spacious"
                selectionMode={'none'}
                onAction={clickListItem}
                renderEmptyState={renderEmptyState}
                      onLoadMore={onLoadMore}
            >
                {item => {
                    let key = '' + item.key;
                    if (key === 'datepicker') {
                        return <Item key={item.key} textValue={item.name} hasChildItems={false}>
                            <Calendar
                              label="Date"
                              granularity="day"
                              visibleMonths={1}
                              onChange={onDateChange}
                            />
                        </Item>
                    }
                    if (!key.includes(':')) {
                        return <Item key={item.key} textValue={item.name} hasChildItems={true}>
                            <Folder />
                            <Text>{item.name}</Text>
                        </Item>
                    }
                    return <Item key={item.key} textValue={item.name} hasChildItems={false}>
                        <Text>{item.name}</Text>
                        <ActionButton aria-label="Copy" onPress={() => copyToClipboard(item.key)}>
                            <Copy /></ActionButton>
                    </Item>
                }}
            </ListView>
        </Flex>
    </Provider>;
}

export default Picker;
