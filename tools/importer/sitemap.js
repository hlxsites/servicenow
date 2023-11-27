
const https = require('https');
const { DOMParser } = require('xmldom');
const fs = require('fs');

// parse a text string into an XML DOM object
function parseXMLSitemap(sitemapContent) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sitemapContent, 'text/xml');
  return xmlDoc;
}

async function getSitemap() {
  return parseXMLSitemap(fs.readFileSync('sitemap.xml').toString());
  //return parseXMLSitemap();
  // return new Promise((resolve) => {
  //   https.get('https://www.servicenow.com/sitemap.xml', (res) => {
  //     const data = [];

  //     res.on('data', (chunk) => {
  //       data.push(chunk);
  //     });

  //     res.on('end', () => {
  //       console.log(Buffer.concat(data).toString());
  //       const entries = parseXMLSitemap(Buffer.concat(data).toString());
  //       resolve(entries);
  //     });
  //   }).on('error', (err) => {
  //     console.log('Error: ', err.message);
  //   });
  // });
}

async function main() {
  const sitemap = await getSitemap();
  const urls = [];
  const edsURL = [];
  const urlElements = sitemap.getElementsByTagName('url');

  for (let i = 0; i < urlElements.length; i++) {
    const urlElement = urlElements[i];
    urls.push(urlElement.getElementsByTagName('loc')[0].textContent);
    edsURL.push(new URL(new URL(urls[i]).pathname, 'https://main--aemeds--servicenow-martech.hlx.live/').toString());
  }

  //urls.forEach((url) => console.log(url));
  //edsURL.forEach((url) => console.log(url));
}

main();