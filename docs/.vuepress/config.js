'use strict';

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
        '//fonts.googleapis.com/css?family=Source+Sans+Pro:400,600|Roboto Mono',
      rel: 'stylesheet',
      type: 'text/css',
    },
  ],
  [
    'link',
    {
      href: '//fonts.googleapis.com/css?family=Dosis:300&amp;text=Vue Select',
      rel: 'stylesheet',
      type: 'text/css',
    },
  ],
  ['link', { rel: 'icon', href: '/favicon-96x96.png' }],
  ['link', { rel: 'icon', href: meta.favicon, type: 'image/png' }],
  ['meta', { name: 'title', content: meta.title }],
  ['meta', { name: 'description', content: meta.description }],
  ['meta', { property: 'og:image', content: meta.icon }],
  ['meta', { property: 'twitter:image', content: meta.icon }],
  ['meta', { name: 'description', content: meta.description }],
  ['meta', { property: 'og:description', content: '' }],
  ['meta', { property: 'twitter:description', content: meta.description }],
  ['meta', { property: 'twitter:title', content: meta.title }],
  ['meta', { property: 'og:title', content: meta.title }],
  ['meta', { property: 'og:site_name', content: meta.title }],
  ['meta', { property: 'og:url', content: meta.url }],
];

module.exports = (ctx) => ({
  configureWebpack: (config) => {
    if (ctx.isProd) {
      config.devtool = 'source-map';
    }
  },
  locales: {
    '/': {
      lang: 'zh-CN',
      title: meta.title,
      description: meta.description,
    },
  },
  head,
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    repo: 'geekdada/surgio',
    repoLabel: 'GitHub',
    editLinks: true,
    editLinkText: '帮助我们改善此页面！',
    docsDir: 'docs',
    algolia: ctx.isProd
      ? {
          apiKey: '6e7242cfd891a169eb12749ab473ba8f',
          indexName: 'surgio',
        }
      : null,
    smoothScroll: true,
    nav: [
      {
        text: 'Changelog',
        link: 'https://github.com/surgioproject/surgio/releases',
      },
    ],
    sidebar: {
      '/guide/': [
        {
          title: '指南',
          collapsable: false,
          children: [
            '',
            'getting-started',
            {
              title: '自定义',
              collapsable: false,
              children: [
                'custom-config',
                'custom-provider',
                'custom-template',
                'custom-artifact',
              ],
            },
            {
              title: '客户端规则维护指南',
              collapsable: false,
              children: ['client/clash'],
            },
            'api',
            'cli',
            'faq',
            'upgrade-guide-v2',
            'learning-resources',
          ],
        },
        {
          title: '进阶',
          collapsable: false,
          children: [
            'advance/surge-advance',
            'advance/custom-filter',
            'advance/automation',
            'advance/api-gateway',
            [
              'https://blog.dada.li/2019/better-proxy-rules-for-apple-services',
              '苹果服务的连接策略推荐',
            ],
          ],
        },
      ],
    },
  },
  plugins: [
    [
      '@vuepress/pwa',
      {
        serviceWorker: true,
        updatePopup: true,
      },
    ],
    [
      '@vuepress/google-analytics',
      {
        ga: 'UA-146417304-1',
      },
    ],
    [
      'vuepress-plugin-sitemap',
      {
        hostname: 'https://surgio.js.org',
      },
    ],
  ],
});
