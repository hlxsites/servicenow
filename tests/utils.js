import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export async function loadHTML(htmlFilePath) {
  const documentHTML = fs.readFileSync(htmlFilePath, 'utf8');
  document.documentElement.innerHTML = documentHTML.toString();

  const event = new Event('load'); // , {bubbles: true}

  // Callback function to execute when mutations are observed
  const callback = (mutationList, observer) => {
    mutationList.forEach((record) => {
      record.addedNodes.forEach((addedNode) => {
        if (addedNode.constructor.name === 'HTMLLinkElement') {
          addedNode.dispatchEvent(event);
        }
      });
      if (record.target.childNodes.length === 0) {
        observer.disconnect();
      }
    });
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);
  // Options for the observer (which mutations to observe)
  const config = { attributes: false, childList: true, subtree: false };

  // Start observing the target node for configured mutations
  observer.observe(document.head, config);

  const lcpCandidate = document.querySelector('main img');
  lcpCandidate.dispatchEvent(event);
  lcpCandidate.src = ''; // forces `waitForLCP` to resolve
  // TODO: watch for the attribute change 'loading'
  return document;
}

export function getPath(moduleUrl, filePath) {
  return path.resolve(path.dirname(fileURLToPath(moduleUrl)), filePath);
}
