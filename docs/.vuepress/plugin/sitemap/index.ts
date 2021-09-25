import type { Plugin } from '@vuepress/core'
import { path } from '@vuepress/utils'
import * as fs from 'fs'
import * as chalk from 'chalk'
import { createSitemap } from 'sitemap'

const log = (msg, color = 'blue', label = 'SITEMAP') =>
  console.log(`\n${chalk.reset.inverse.bold[color](` ${label} `)} ${msg}`);

function stripLocalePrefix(path, localePathPrefixes) {
  const matchingPrefix = localePathPrefixes
    .filter((prefix) => path.startsWith(prefix))
    .shift();
  return {
    normalizedPath: path.replace(matchingPrefix, '/'),
    localePrefix: matchingPrefix,
  };
}

const plugin: Plugin<any> = (options, app) => {
  const {
    urls = [],
    hostname,
    cacheTime = 600,
    xslUrl,
    xmlNs,
    outFile = 'sitemap.xml',
    changefreq = 'daily',
    exclude = [],
    dateFormatter = (lastUpdated) => new Date(lastUpdated).toISOString(),
    ...others
  } = options;

  return {
    name: 'sitemap',
    onGenerated: () => {
      if (!hostname) {
        return log(
          'Not generating sitemap because required "hostname" option doesn\'t exist',
          'red',
        );
      }

      log('Generating sitemap...');

      const {locales, base} = app.siteData
      const { pages } = app;

      const withBase = (url) => base.replace(/\/$/, '') + url;

      // Sort the locale keys in reverse order so that longer locales, such as '/en/', match before the default '/'
      const localeKeys =
        (locales && Object.keys(locales).sort().reverse()) || [];
      const localesByNormalizedPagePath = pages.reduce((map, page) => {
        const { normalizedPath, localePrefix } = stripLocalePrefix(
          page.path,
          localeKeys,
        );
        const prefixesByPath = map.get(normalizedPath) || [];
        prefixesByPath.push(localePrefix);
        return map.set(normalizedPath, prefixesByPath);
      }, new Map());

      const pagesMap = new Map();

      pages.forEach((page) => {
        const fmOpts: any = page.frontmatter.sitemap || {};
        const metaRobots = (page.frontmatter.meta as any || []).find(
          (meta) => meta.name === 'robots',
        );
        const excludePage = metaRobots
          ? (metaRobots.content || '')
              .split(/,/)
              .map((x) => x.trim())
              .includes('noindex')
          : fmOpts.exclude === true;

        if (excludePage) {
          exclude.push(page.path);
        }

        const lastmodISO = (page as any).lastUpdated
          ? dateFormatter((page as any).lastUpdated)
          : undefined;

        const { normalizedPath } = stripLocalePrefix(page.path, localeKeys);
        const relatedLocales = localesByNormalizedPagePath.get(normalizedPath);

        let links = [];
        if (relatedLocales.length > 1) {
          links = relatedLocales.map((localePrefix) => {
            return {
              lang: locales[localePrefix].lang,
              url: withBase(normalizedPath.replace('/', localePrefix)),
            };
          });
        }

        pagesMap.set(page.path, {
          changefreq: fmOpts.changefreq || changefreq,
          lastmodISO,
          links,
          ...others,
        });
      });

      const sitemap = createSitemap({
        urls,
        hostname,
        cacheTime: cacheTime * 1000,
        xmlNs,
        xslUrl,
      });

      pagesMap.forEach((page, url) => {
        if (!exclude.includes(url)) {
          sitemap.add({
            url: withBase(url),
            ...page,
          });
        }
      });

      urls.forEach((item) => {
        const page = pagesMap.get(item.url);
        if (page) {
          sitemap.del(item.url);
          sitemap.add({ ...page, ...item });
        } else {
          sitemap.add(item);
        }
      });

      log(`found ${sitemap.urls.length} locations`);
      const sitemapXML = path.resolve(app.dir.dest(), outFile);

      fs.writeFileSync(sitemapXML, sitemap.toString());
      log(`${sitemap.urls.length} locations have been written.`);
    },
  };
};

module.exports = plugin
