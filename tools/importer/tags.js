// script that is called from command line to fetch a sitemap.xml and iterate over it
//
// usage:
// node tools/importer/import.js https://main--servicenow--hlxsites.hlx.page



/* eslint-disable no-console, class-methods-use-this */



const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var DOMParser = require('xmldom').DOMParser;

function fetchSync(method, url) {
  // we use old XMLHttpRequest as fetch seams to have problems in bulk import
  const request = new XMLHttpRequest();
  request.open(method, url, false);
  // request.overrideMimeType('text/json; UTF-8');
  request.send(null);
  return {
    status: request.status,
    body: request.responseText,
  }
}

function jsonRenditionURL(url) {
  return url.replace('.html', '.1.json');
}

function getOriginalTags(jsonRendition) {
  return jsonRendition['jcr:content']['cq:tags'];
}




// get sitemap content and parse it to Document Object Model
function getXMLSitemapObject(sitemapFile, callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if ((this.readyState === 4) && (this.status === 200)) {
      var sitemapContent = this.responseText;
      var sitemapObject = parseXMLSitemap(sitemapContent);
      callback(sitemapObject);
    }
  };
  xhttp.open('GET', sitemapFile, true);
  xhttp.send();
}

// parse a text string into an XML DOM object
function parseXMLSitemap(sitemapContent) {
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(sitemapContent, 'text/xml');
  return xmlDoc;
}

function getOriginalCategoryTag(originalTags) {
  return originalTags.find((tag) => tag.startsWith('sn-blog-docs:category'));
}

function getOriginalTopicTag(originalTags) {
  return originalTags.find((tag) => tag.startsWith('sn-blog-docs:topic'));
}

function getOriginalNewTrendTag(originalTags) {
  return originalTags.find((tag) => tag.startsWith('sn-blog-docs:new-trend'));
}

console.log('running');
getXMLSitemapObject('https://www.servicenow.com/sitemap.xml', function(sitemapObject) {
  // retrieve properties from the sitemap object
  var urls = sitemapObject.getElementsByTagName('url');

  // create an empty list of topics
  var topics = [];
  var categories = [];
  var newTrends = [];

  for (var i = 0; i < urls.length; i++) {
    var urlElement = urls[i];

    var loc = urlElement.getElementsByTagName('loc')[0].textContent;

    // if loc contains regular expression /blogs/*.html
    if (loc.match(/\/blogs\/[0-9]*\/.*\.html/)) {
      console.log(i + ' of ' + urls.length + ': ' + loc);
      let pageAsJson = fetchSync('GET', jsonRenditionURL(loc));
      if (pageAsJson.status === 200) {
        const jsonRendition = JSON.parse(pageAsJson.body);
        const originalTags = getOriginalTags(jsonRendition);
        if (originalTags !== undefined) {
          let originalTopicTag = getOriginalTopicTag(originalTags);
          let originalCategoryTag = getOriginalCategoryTag(originalTags);
          let originalNewTrendTag = getOriginalNewTrendTag(originalTags);

          // console.log(originalTopicTag);
          // if topics does not contain originalTopicTag add it
          if (!topics.includes(originalTopicTag)) {
            topics.push(originalTopicTag);
          }

          if (!categories.includes(originalCategoryTag)) {
            categories.push(originalCategoryTag);
          }

          if (!newTrends.includes(originalNewTrendTag)) {
            newTrends.push(originalNewTrendTag);
          }
        } else {
          console.log('originalTags is undefined');
        }
      }
    }
  }

  console.log(topics.sort());

  console.log(categories.sort());

  console.log(newTrends.sort());
});
