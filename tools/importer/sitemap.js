
const https = require('https');
const { DOMParser } = require('xmldom');

// parse a text string into an XML DOM object
function parseXMLSitemap(sitemapContent) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sitemapContent, 'text/xml');
  return xmlDoc;
}

async function getSitemap() {
  return new Promise((resolve) => {
    https.get('https://www.servicenow.com/sitemap.xml', (res) => {
      const data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        const entries = parseXMLSitemap(Buffer.concat(data).toString());
        resolve(entries);
      });
    }).on('error', (err) => {
      console.log('Error: ', err.message);
    });
  });
}

async function main() {
  const sitemap = await getSitemap();
  const urls = [];
  const urlElements = sitemap.getElementsByTagName('url');

  for (let i = 0; i < urlElements.length; i++) {
    const urlElement = urlElements[i];
    urls.push(urlElement.getElementsByTagName('loc')[0].textContent);
  }

  urls.forEach((url) => console.log(url));
}

main();