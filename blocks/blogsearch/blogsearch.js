import {
  a, div, form, input, i,
} from '../../scripts/dom-helpers.js';
import { getLocaleInfo, debounce } from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';

async function handleSearch(block) {
  const searchValue = block.querySelector('input').value;
  if (searchValue.length < 3) {
    return;
  }

  const searchResults = block.querySelector('.search-results');
  searchResults.innerHTML = '';

  console.log(`searching for ${searchValue}`);

  const entries = await ffetch(`${getLocaleInfo().metadataIndex}`)
    .sheet('blogs-content')
    .filter((entry) => {
      const searchTerms = searchValue.toLowerCase().split(/\s+/);
      const prefixLength = getLocaleInfo().placeholdersPrefix.length;

      return searchTerms.some((term) => (entry.title && entry.title.toLowerCase()
        .includes(term))
          || (entry.description && entry.description.toLowerCase()
            .includes(term))
          || (entry.header && entry.header.toLowerCase()
            .includes(term))
        || (entry.path && entry.path.substring(prefixLength).toLowerCase()
          .includes(term))
          || (entry.content && entry.content.toLowerCase()
            .includes(term)),
      );
    })
    .all();

  // potential improvement: search content separately, first show those
  // that match on title, description and header
  //
  // while sorting by publicationDate would potentially make sense, it's not what's currently
  // implemented on servicenow.com

  // eslint-disable-next-line no-restricted-syntax
  for await (const entry of entries) {
    console.log(entry);
    searchResults.append(
      a({ href: entry.path }, entry.title),
    );
  }
}

export default async function decorate(block) {
  console.log('decorate');
  block.innerHtml = '';
  block.textContent = '';
  const debouncedSearch = debounce(() => {
    handleSearch(block);
  }, 350);
  block.append(
    form({},
      div({ class: 'search-container' },
        i({ class: 'search-icon' }),
        input({
          type: 'text',
          oninput: () => { debouncedSearch(); }
          ,
        })),
      div({ class: 'search-results' })));
}
