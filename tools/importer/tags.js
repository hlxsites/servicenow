// script that is called from command line to fetch a sitemap.xml and iterate over it
//
// usage:
// node tools/importer/import.js https://main--servicenow--hlxsites.hlx.page

/* eslint-disable no-console, class-methods-use-this */

const { XMLHttpRequest } = require('xmlhttprequest');
const { DOMParser } = require('xmldom');

function fetchSync(method, url) {
  // we use old XMLHttpRequest as fetch seams to have problems in bulk import
  const request = new XMLHttpRequest();
  request.open(method, url, false);
  // request.overrideMimeType('text/json; UTF-8');
  request.send(null);
  return {
    status: request.status,
    body: request.responseText,
  };
}

function jsonRenditionURL(url) {
  return url.replace('.html', '.1.json');
}

function getOriginalTags(jsonRendition) {
  return jsonRendition['jcr:content']['cq:tags'];
}

function getCanonicalUrl(jsonRendition) {
  const canonicalUrl = jsonRendition['jcr:content']['canonicalUrl'];
  if (canonicalUrl === undefined) {
    return '';
  }
  return canonicalUrl;
}

// get sitemap content and parse it to Document Object Model
function getXMLSitemapObject(sitemapFile, callback) {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if ((this.readyState === 4) && (this.status === 200)) {
      const sitemapContent = this.responseText;
      const sitemapObject = parseXMLSitemap(sitemapContent);
      callback(sitemapObject);
    }
  };
  xhttp.open('GET', sitemapFile, true);
  xhttp.send();
}

// parse a text string into an XML DOM object
function parseXMLSitemap(sitemapContent) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sitemapContent, 'text/xml');
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

function getPublishedDate(jsonRendition) {
  return jsonRendition['jcr:content'].date;
}

const timezoneMap = {
  '+0530': 'Asia/Calcutta',
};

function getCorrectedDate(dateString) {
  const tzMatch = dateString.match(/GMT[+-][0-9]{4}/);
  let timeZone = '';
  if (tzMatch) {
    const offset = tzMatch[0].substring(3);
    // if the offset ends in 00 remove it from offset
    if (offset.endsWith('00')) {

      // remove 00  suffix
      const o = offset.substring(1, offset.length - 2);
      const absolute = o.replace(/^0+/, '');

      const sign = offset.startsWith('-') ? '+' : '-';
      // remove any leading zeroes from o e.g. -0700 becomes -7
      timeZone = absolute === '' ? 'Etc/GMT' : `Etc/GMT${sign}${absolute}`;

      console.log('date:', dateString, ' timeZone: ', timeZone);
    } else {
      timeZone = timezoneMap[offset];
      console.log('Odd offset found: ', offset);
    }
  } else {
    console.log('date does not match time zone pattern: ', dateString, ' timeZone: ', timeZone);
  }

  const dateObj = new Date(dateString);

  console.log('Converting date: ', dateString, ' timeZone: ', timeZone);

  return dateObj.toLocaleDateString(
    'en-US',
    {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone,
    },
  );
}

function getPreviousDate(dateString) {
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString(
    'en-US',
    {
      day: '2-digit', month: '2-digit', year: 'numeric',
    },
  );
}

const sitemaps = [
  // { locale: 'en-US', sitemap: 'https://www.servicenow.com/sitemap.xml' },
  // { locale: 'fr-FR', sitemap: 'https://www.servicenow.com/fr/sitemap.xml' },
  // { locale: 'de-DE', sitemap: 'https://www.servicenow.com/de/sitemap.xml' },
  { locale: 'en-GB', sitemap: 'https://www.servicenow.com/uk/sitemap.xml' },
  // { locale: 'nl-NL', sitemap: 'https://www.servicenow.com/nl/sitemap.xml' },
];

console.log('running');

for (let j = 0; j < sitemaps.length; j++) {
  getXMLSitemapObject(sitemaps[j].sitemap, (sitemapObject) => {
    console.log('Processing locale %s', sitemaps[j].locale);
    // create an empty list of topics
    const topics = [];
    const categories = [];
    const newTrends = [];

    const all = [];

    // retrieve properties from the sitemap object
    const urls = sitemapObject.getElementsByTagName('url');

    for (let i = 0; i < urls.length; i++) {
      const urlElement = urls[i];

      const loc = urlElement.getElementsByTagName('loc')[0].textContent;

      // if loc contains regular expression /blogs/*.html
      if (loc.match(/\/blogs\/[0-9]*\/.*\.html/)) {
        console.log(`${i} of ${urls.length}: ${loc}`);
        const pageAsJson = fetchSync('GET', jsonRenditionURL(loc));
        if (pageAsJson.status === 200) {
          let jsonRendition = {};

          try {
            jsonRendition = JSON.parse(pageAsJson.body);
          } catch (e) {
            console.log('error parsing json');
            continue;
          }

          const originalTags = getOriginalTags(jsonRendition);
          if (originalTags !== undefined) {
            const originalTopicTag = getOriginalTopicTag(originalTags);
            const originalCategoryTag = getOriginalCategoryTag(originalTags);
            const originalNewTrendTag = getOriginalNewTrendTag(originalTags);

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

            const publishedDate = getPublishedDate(jsonRendition);
            const correctedDate = getCorrectedDate(publishedDate);
            const previousDate = getPreviousDate(publishedDate);

            const canonicalUrl = getCanonicalUrl(jsonRendition);

            const wrongDate = previousDate !== correctedDate;

            all.push({
              locale: sitemaps[j].locale,
              loc,
              topic: originalTopicTag,
              category: originalCategoryTag,
              newTrend: originalNewTrendTag,
              previousDate,
              correctedDate,
              wrongDate,
              canonicalUrl,
            });
          } else {
            console.log('originalTags is undefined');
          }
        }
      }
    }
    // console.log(topics.sort());
    //
    // console.log(categories.sort());
    //
    // console.log(newTrends.sort());

    // itearte over all array and display properties loc and topic as csv line
    for (let k = 0; k < all.length; k++) {
      const element = all[k];
      console.log(`${element.locale},${element.loc},${element.topic},${element.category},${element.newTrend},${element.previousDate},${element.correctedDate},${element.wrongDate},${element.canonicalUrl}`);
    }
  });
}
