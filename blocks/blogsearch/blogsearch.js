import { div, form, input, span, i } from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
console.log("1");
    console.log(block.innerHtml);
    block.innerHtml = '';
    block.textContent='';
    console.log("2");
    console.log(block.innerHtml);
    console.log("decorating blogsearch");
    block.append(
        form({}, 
            div({}, 
                i({class: 'search-icon'}) , 
                input({
                    type: 'text'
                }))));
}