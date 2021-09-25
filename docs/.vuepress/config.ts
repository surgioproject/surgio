'use strict';

import { path } from '@vuepress/utils'

const meta = {
  title: 'Surgio',
  description: '一站式各类代理规则生成器',
  url: 'https://surgio.js.org',
  icon: 'https://surgio.js.org/surgio-square.png',
  favicon: 'https://surgio.js.org/favicon-96x96.png',
};
const head = [
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
      defer: true
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
];

export default {
  locales: {
    '/': {
      lang: 'zh-CN',
      title: meta.title,
      description: meta.description,
    },
  },
  title: meta.title,
  description: meta.description,
  head,
  theme: path.resolve(__dirname, './theme'),
  themeConfig: {
    docsRepo: 'geekdada/surgio',
    docsBranch: 'master',
    repoLabel: 'GitHub',
    editLink: true,
    editLinkText: '帮助我们改善此页面！',
    docsDir: 'docs',
    navbar: [
      {
        text: 'Changelog',
        link: 'https://github.com/surgioproject/surgio/releases',
      },
    ],
    sidebar: [
      {
        text: '指南',
        children: [
          '/guide',
          '/guide/getting-started',
          {
            text: '自定义',
            children: [
              '/guide/custom-config',
              '/guide/custom-provider',
              '/guide/custom-template',
              '/guide/custom-artifact',
            ],
          },
          {
            text: '客户端规则维护指南',
            children: ['/guide/client/clash'],
          },
          '/guide/api',
          '/guide/cli',
          '/guide/faq',
          '/guide/upgrade-guide-v2',
          '/guide/learning-resources',
        ],
      },
      {
        text: '进阶',
        children: [
          '/guide/advance/surge-advance',
          '/guide/advance/custom-filter',
          '/guide/advance/automation',
          '/guide/advance/api-gateway',
          {
            link: 'https://blog.dada.li/2019/better-proxy-rules-for-apple-services',
            text: '苹果服务的连接策略推荐'
          }
        ],
      },
    ],
  },
  plugins: [
    [
      '@vuepress/docsearch',
      {
        apiKey: '6e7242cfd891a169eb12749ab473ba8f',
        indexName: 'surgio',
      },
    ],
    [
      '@vuepress/register-components',
      {
        components: {
          Sponsor: path.resolve(__dirname, './components/Sponsor.vue'),
        },
      },
    ],
    [
      '@vuepress/google-analytics',
      {
        ga: 'UA-146417304-1',
      },
    ],
    [
      require('./plugin/sitemap'),
      {
        hostname: 'https://surgio.js.org',
      },
    ],
  ],
};
