import { defineUserConfig } from 'vuepress'
import { path } from '@vuepress/utils'
import docsearchPlugin from  '@vuepress/plugin-docsearch'
import registerComponentsPlugin from '@vuepress/plugin-register-components'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics';

import customTheme from './theme'
import sitemapPlugin from './plugin/sitemap'

const meta = {
  title: 'Surgio',
  description: '一站式各类代理规则生成器',
  url: 'https://surgio.js.org',
  icon: 'https://surgio.js.org/surgio-square.png',
  favicon: 'https://surgio.js.org/favicon-96x96.png',
};

export default defineUserConfig({
  locales: {
    '/': {
      lang: 'zh-CN',
      title: meta.title,
      description: meta.description,
    },
  },
  title: meta.title,
  description: meta.description,
  head: [
    [
      'link',
      {
        href:
          'https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600|Roboto Mono',
        rel: 'stylesheet',
        type: 'text/css',
      },
    ],
    [
      'link',
      {
        href: 'https://fonts.googleapis.com/css?family=Dosis:300&amp;text=Vue Select',
        rel: 'stylesheet',
        type: 'text/css',
      },
    ],
    [
      'script',
      {
        src: 'https://buttons.github.io/buttons.js',
        async: true,
        defer: true,
      }
    ],
    ['link', { rel: 'icon', href: '/favicon-96x96.png' }],
    ['link', { rel: 'icon', href: meta.favicon, type: 'image/png' }],
    ['meta', { property: 'og:image', content: meta.icon }],
    ['meta', { property: 'twitter:image', content: meta.icon }],
    ['meta', { property: 'og:description', content: meta.description }],
    ['meta', { property: 'twitter:description', content: meta.description }],
    ['meta', { property: 'twitter:title', content: meta.title }],
    ['meta', { property: 'og:title', content: meta.title }],
    ['meta', { property: 'og:site_name', content: meta.title }],
    ['meta', { property: 'og:url', content: meta.url }],
  ],
  theme: customTheme,
  plugins: [
    docsearchPlugin({
      appId: 'AXEPS6U765',
      apiKey: 'c7282707083d364aceb47ba33e14d5ab',
      indexName: 'surgio',
    }),
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, './components'),
    }),
    googleAnalyticsPlugin({
      id: 'UA-146417304-1',
    }),
    sitemapPlugin({
      hostname: 'https://surgio.js.org',
    }),
  ],
})
