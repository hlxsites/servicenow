import * as fs from 'fs';
import { mkdir, readFile } from 'node:fs/promises';
import { DOMParser } from 'xmldom';
import { program } from 'commander';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import * as path from 'path';

/*
Usage:
node app.mjs diff
node app.mjs download_old
node app.mjs download_new
node app.mjs find uppercase
node app.mjs find nonalnum
node app.mjs redirects | pbcopy
paste into redirects.xls
  click on Ctrl (paste options) > Text to columns > Select 'Comma' > Apply
*/

const SKIP_URLS = `
https://www.servicenow.com/blogs/topics/work-better.html
https://www.servicenow.com/blogs/topics/talent-and-engagement.html
https://www.servicenow.com/blogs/topics/strategy.html
https://www.servicenow.com/blogs/topics/service-delivery-and-management.html
https://www.servicenow.com/blogs/topics/partners.html
https://www.servicenow.com/blogs/topics/organizational-change-management.html
https://www.servicenow.com/blogs/topics/operations-and-uptime.html
https://www.servicenow.com/blogs/topics/low-code.html
https://www.servicenow.com/blogs/topics/life-at-now.html
https://www.servicenow.com/blogs/topics/knowledge.html
https://www.servicenow.com/blogs/topics/knowledge-2020.html
https://www.servicenow.com/blogs/topics/industry.html
https://www.servicenow.com/blogs/topics/global-impact.html
https://www.servicenow.com/blogs/topics/diversity-inclusion-and-belonging.html
https://www.servicenow.com/blogs/topics/digital-workflows.html
https://www.servicenow.com/blogs/topics/data-and-analytics.html
https://www.servicenow.com/blogs/topics/customer-service.html
https://www.servicenow.com/blogs/topics/creatorcon.html
https://www.servicenow.com/blogs/topics/covid-19.html
https://www.servicenow.com/blogs/topics/corporate-announcement.html
https://www.servicenow.com/blogs/topics/asset-and-cost-management.html
https://www.servicenow.com/blogs/topics.html
https://www.servicenow.com/blogs/category.html
https://www.servicenow.com/blogs/blogs/2023/leader-low-code-no-code-development.html
https://www.servicenow.com/blogs/blogs/2022/leader-low-code-development-platforms.html
https://www.servicenow.com/blogs/blogs/2021/leader-in-low-code-development-platforms.html
https://www.servicenow.com/blogs/author.html
https://www.servicenow.com/uk/blogs/topics.html
https://www.servicenow.com/uk/blogs/category.html
https://www.servicenow.com/uk/blogs/author.html
https://www.servicenow.com/uk/blogs/2022/iamremarkable-how-servicenow-is-supporting-women-to-the-top.html
https://www.servicenow.com/de/blogs/topics/work-better.html
https://www.servicenow.com/de/blogs/topics/template.html
https://www.servicenow.com/de/blogs/topics/talent-and-engagement.html
https://www.servicenow.com/de/blogs/topics/strategy.html
https://www.servicenow.com/de/blogs/topics/research.html
https://www.servicenow.com/de/blogs/topics/partners.html
https://www.servicenow.com/de/blogs/topics/life-at-now.html
https://www.servicenow.com/de/blogs/topics/knowledge.html
https://www.servicenow.com/de/blogs/topics/knowledge-2020.html
https://www.servicenow.com/de/blogs/topics/industry.html
https://www.servicenow.com/de/blogs/topics/global-impact.html
https://www.servicenow.com/de/blogs/topics/diversity-inclusion-and-belonging.html
https://www.servicenow.com/de/blogs/topics/digital-workflows.html
https://www.servicenow.com/de/blogs/topics/digital-transformation.html
https://www.servicenow.com/de/blogs/topics/data-and-analytics.html
https://www.servicenow.com/de/blogs/topics/app-engine.html
https://www.servicenow.com/de/blogs/topics.html
https://www.servicenow.com/de/blogs/template.html
https://www.servicenow.com/de/blogs/category.html
https://www.servicenow.com/fr/blogs/topics/work-better.html
https://www.servicenow.com/fr/blogs/topics/template.html
https://www.servicenow.com/fr/blogs/topics/talent-and-engagement.html
https://www.servicenow.com/fr/blogs/topics/strategy.html
https://www.servicenow.com/fr/blogs/topics/research.html
https://www.servicenow.com/fr/blogs/topics/partners.html
https://www.servicenow.com/fr/blogs/topics/life-at-now.html
https://www.servicenow.com/fr/blogs/topics/knowledge.html
https://www.servicenow.com/fr/blogs/topics/knowledge-2020.html
https://www.servicenow.com/fr/blogs/topics/industry.html
https://www.servicenow.com/fr/blogs/topics/healthcare.html
https://www.servicenow.com/fr/blogs/topics/global-impact.html
https://www.servicenow.com/fr/blogs/topics/education.html
https://www.servicenow.com/fr/blogs/topics/diversity-inclusion-and-belonging.html
https://www.servicenow.com/fr/blogs/topics/digital-workflows.html
https://www.servicenow.com/fr/blogs/topics/digital-transformation.html
https://www.servicenow.com/fr/blogs/topics/data-and-analytics.html
https://www.servicenow.com/fr/blogs/topics/covid-19.html
https://www.servicenow.com/fr/blogs/topics/business-impact.html
https://www.servicenow.com/fr/blogs/topics.html
https://www.servicenow.com/fr/blogs/template.html
https://www.servicenow.com/fr/blogs/fr/blogs/2023/lia-et-les-competences-de-demain.html
https://www.servicenow.com/fr/blogs/fr/blogs/2020/se-preparer-a-la-normalite-de-demain.html
https://www.servicenow.com/fr/blogs/category/home.html
https://www.servicenow.com/fr/blogs/category.html
https://www.servicenow.com/fr/blogs/author/matt-schvimmer/mike-vilimek.html
https://www.servicenow.com/fr/blogs/author.html
https://www.servicenow.com/nl/blogs/topics.html
https://www.servicenow.com/nl/blogs/category.html
https://www.servicenow.com/nl/blogs/author.html
`;

const LANGUAGES = ['us', 'uk', 'fr', 'de', 'nl'];
const DATA_OLD = 'data_old';
const DATA_NEW = 'data_new';

function old2newLink(pathname) {
  const ext = '.html';
  if (!pathname.toLowerCase().endsWith(ext)) {
    throw new Error(`${pathname} does not contain .html`);
  }
  return `${pathname.substring(0, pathname.lastIndexOf('.html')).toLowerCase()}`;
}

async function downloadFile(url, fileName) {
  const headers = new Headers({
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0',
  });
  const res = await fetch(url, { headers });
  if (!fs.existsSync(path.dirname(fileName))) await mkdir(path.dirname(fileName));
  const fileStream = fs.createWriteStream(fileName, { flags: 'w' });
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function getDoc(file) {
  const xmlString = await readFile(file, 'utf8');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  return xmlDoc;
}

// topics, category, author, year
async function getSegments(lang, name) {
  // TODO: error handling
  const xmlDoc = await getDoc(`./${DATA_OLD}/${lang}.sitemap.xml`);

  // Find all loc elements that contain '/blogs/category/'
  const locs = xmlDoc.getElementsByTagName('loc');
  const checkPath = (lang === 'us') ? `com/blogs/${name}/` : `com/${lang}/blogs/${name}/`;
  const result = [];

  for (let i = 0; i < locs.length; i += 1) {
    const loc = locs[i];
    if (loc.textContent.includes(checkPath) && !loc.textContent.endsWith('/home.html')) {
      // ignore /blogs/category/home.html which redirects to /blogs.html
      const url = new URL(loc.textContent);
      // get last segment from url.pathname
      const segments = url.pathname.split('/');
      const category = segments[segments.length - 1];
      const categoryText = category.replace('.html', '').replace(/-/g, ' ').toLowerCase();
      result.push(categoryText);
    }
  }
  return result;
}

async function getLinks(lang, name) {
  // TODO: error handling
  const xmlDoc = await getDoc(`./${DATA_OLD}/${lang}.sitemap.xml`);

  const locs = xmlDoc.getElementsByTagName('loc');
  let result = '';
  const checkPath = (lang === 'us') ? `com/blogs/${name}/` : `com/${lang}/blogs/${name}/`;
  for (let i = 0; i < locs.length; i += 1) {
    const loc = locs[i];
    if (loc.textContent.includes(checkPath)) {
      result += `${loc.textContent.trim()}\n`;
    }
  }
  return result;
}


program
  .version('1.0.0')
  .description('A CLI tool for extracting data from sitemaps');

/*
node app.mjs names us category
node app.mjs names nl category
node app.mjs names us topics
node app.mjs names us author
node app.mjs names us 2021
*/
program.command('names')
  .description('Prints all names of a certain type')
  .argument('<lang>')
  .argument('<name>', 'One of: category, topics, author, 2023, 2022, etc')
  .action(async (lang, name) => {
    const result = await getSegments(lang, name);
    console.log(result);
  });

/*
node app.mjs links nl author
node app.mjs links us author
node app.mjs links uk author
node app.mjs links uk 2021
*/
program.command('links')
  .description('Prints all links')
  .argument('<lang>')
  .argument('<name>')
  .action(async (lang, name) => {
    const result = await getLinks(lang, name);
    console.log(result);
  });

// node app.mjs all-categories
program.command('all-categories')
  .description('Prints all categories')
  .action(async () => {
    const result = {};
    const type = 'category';
    result.us = await getSegments('us', type);
    result.uk = await getSegments('uk', type);
    result.fr = await getSegments('fr', type);
    result.de = await getSegments('de', type);
    result.nl = await getSegments('nl', type);
    console.log(result);
  });

// node app.mjs all-topics
program.command('all-topics')
  .description('Prints all topics')
  .action(async () => {
    const result = {};
    const type = 'topics';
    result.us = await getSegments('us', type);
    result.uk = await getSegments('uk', type);
    result.fr = await getSegments('fr', type);
    result.de = await getSegments('de', type);
    result.nl = await getSegments('nl', type);
    console.log(result);
  });

// node app.mjs all-articles us
program.command('all-articles')
  .description('Prints all articles')
  .argument('<lang>')
  .action(async (lang) => {
    // let result = '';
    const promisesArray = [];
    for (let year = 2013; year <= 2024; year += 1) {
      promisesArray.push(getLinks(lang, year));
    }
    const result = await Promise.all(promisesArray);
    const res = result.filter((x) => x);
    console.log(res.join(''));
  });

// node app.mjs redirects | pbcopy
program.command('redirects')
  .description('Prints a comma separated list of blog redirects')
  .action(async () => {
    const results = [];

    // eslint-disable-next-line no-restricted-syntax
    for await (const lang of LANGUAGES) {
      const checkPath = (lang === 'us') ? '/blogs/' : `/${lang}/blogs/`;
      const xmlDoc = await getDoc(`./${DATA_OLD}/${lang}.sitemap.xml`);
      const locs = xmlDoc.getElementsByTagName('loc');
      for (let i = 0; i < locs.length; i += 1) {
        const url = new URL(locs[i].textContent);
        if (url.pathname.startsWith(checkPath)) {
          results.push(`${url.pathname},${old2newLink(url.pathname)}`);
        }
      }
    }
    console.log([...new Set(results)].join('\n'));
  });

// node app.mjs redirects | pbcopy
program.command('find')
  .description('Finds uppercase letters in urls')
  .argument('<kind>')
  .action(async (kind) => {
    const results = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const lang of LANGUAGES) {
      const xmlDoc = await getDoc(`./${DATA_OLD}/${lang}.sitemap.xml`);
      const locs = xmlDoc.getElementsByTagName('loc');
      for (let i = 0; i < locs.length; i += 1) {
        const checkPath = (lang === 'us') ? '/blogs/' : `/${lang}/blogs/`;
        const url = new URL(locs[i].textContent);
        if (url.pathname.startsWith(checkPath)) {
          switch (kind) {
            case 'uppercase': {
              const uppercaseLetters = url.pathname.match(/[A-Z]/g);
              if (uppercaseLetters) {
                results.push(url.pathname);
              }
              break;
            }
            case 'nonalnum': {
              // const found = url.pathname.match(/[^[:alnum:]_]/g);
              const found = url.pathname.match(/[^-\w./]/g);
              if (found) {
                results.push(url.pathname);
              }
              break;
            }
            default:
          }
        }
      }
    }
    console.log([...new Set(results)].join('\n'));
  });

program.command('download_old')
  .description('Downloads a separate sitemap.xml for each language')
  .action(async () => {
    LANGUAGES.forEach(async (lang) => {
      const pathName = (lang === 'us') ? '/sitemap.xml' : `/${lang}/sitemap.xml`;
      const url = `https://www.servicenow.com${pathName}`;
      await downloadFile(url, `./${DATA_OLD}/${lang}.sitemap.xml`);
    });
  });

program.command('download_new')
  .description('Downloads the ESD sitemap.xml')
  .action(async () => {
    const url = 'https://main--servicenow--hlxsites.hlx.live/blogs/sitemap.xml';
    await downloadFile(url, `./${DATA_NEW}/sitemap.xml`);
  });

program.command('diff')
  .description('Diff between old and new sitemap links')
  .action(async () => {
    const oldLinks = [];
    const newLinks = [];
    const skipLinks = SKIP_URLS.split('\n').filter((u) => u).map((u) => { const url = new URL(u); return old2newLink(url.pathname); });
    // console.log(skipLinks);

    // eslint-disable-next-line no-restricted-syntax
    for await (const lang of LANGUAGES) {
      const xmlDoc = await getDoc(`./${DATA_OLD}/${lang}.sitemap.xml`);
      const locs = xmlDoc.getElementsByTagName('loc');
      for (let i = 0; i < locs.length; i += 1) {
        const checkPath = (lang === 'us') ? '/blogs/' : `/${lang}/blogs/`;
        const url = new URL(locs[i].textContent);
        if (url.pathname.startsWith(checkPath)) {
          oldLinks.push(old2newLink(url.pathname));
        }
      }
    }
    const xmlDoc = await getDoc(`./${DATA_NEW}/sitemap.xml`);
    const locs = xmlDoc.getElementsByTagName('loc');
    for (let i = 0; i < locs.length; i += 1) {
      const url = new URL(locs[i].textContent);
      newLinks.push(url.pathname);
    }

    const differenceOldNew = oldLinks
      .filter((x) => !newLinks.includes(x))
      .filter((x) => !skipLinks.includes(x));
    console.log(`oldLinks - newLinks = ${differenceOldNew.length}`);
    console.dir(differenceOldNew, { maxArrayLength: null });

    const differenceNewOld = newLinks
      .filter((x) => !oldLinks.includes(x))
      .filter((x) => !skipLinks.includes(x));
    console.log(`newLinks - oldLinks = ${differenceNewOld.length}`);
    console.dir(differenceNewOld, { maxArrayLength: null });
  });

program.parse(process.argv);
