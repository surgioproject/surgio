'use strict';

const meta = {
  title: 'Surgio',
  description: '一站式各类代理规则生成器',
  url: 'https://surgio.royli.dev',
  icon: 'https://surgio.royli.dev/surgio-square.png',
  favicon: 'https://surgio.royli.dev/favicon-96x96.png',
};
const head = [
  [
    'link',
    {
      href: '//fonts.googleapis.com/css?family=Source+Sans+Pro:400,600|Roboto Mono',
      rel: 'stylesheet',
      type: 'text/css',
    }],
  [
    'link',
    {
      href: '//fonts.googleapis.com/css?family=Dosis:300&amp;text=Vue Select',
      rel: 'stylesheet',
      type: 'text/css',
    }],
  ['link', {rel: 'icon', href: '/favicon-96x96.png'}],
  ['link', {rel: 'icon', href: meta.favicon, type: 'image/png'}],
  ['meta', {name: 'title', content: meta.title}],
  ['meta', {name: 'description', content: meta.description}],
  ['meta', {property: 'og:image', content: meta.icon}],
  ['meta', {property: 'twitter:image', content: meta.icon}],
  ['meta', {name: 'description', content: meta.description}],
  ['meta', {property: 'og:description', content: ''}],
  ['meta', {property: 'twitter:description', content: meta.description}],
  ['meta', {property: 'twitter:title', content: meta.title}],
  ['meta', {property: 'og:title', content: meta.title}],
  ['meta', {property: 'og:site_name', content: meta.title}],
  ['meta', {property: 'og:url', content: meta.url}],
];

module.exports = {
  locales: {
    '/': {
      lang: 'zh-CN',
      title: meta.title,
      description: meta.description,
    }
  },
  head,
  themeConfig: {
    algolia: {
      apiKey: '6e7242cfd891a169eb12749ab473ba8f',
      indexName: 'surgio',
    },
    markdown: {
      lineNumbers: true
    },
    nav: [
      {
        text: 'Changelog',
        link: 'https://github.com/geekdada/surgio/blob/master/CHANGELOG.md'
      },
      {
        text: 'GitHub',
        link: 'https://github.com/geekdada/surgio'
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
              ]
            },
            {
              title: '客户端规则维护指南',
              collapsable: false,
              children: [
                'client/clash',
              ]
            },
            'api',
            'cli',
            '0.x-to-1.0',
          ]
        },
        {
          title: '进阶',
          collapsable: false,
          children: [
            'advance/surge-advance',
            'advance/custom-filter',
            'advance/automation',
            'advance/api-gateway',
            'advance/api-gateway-beta',
            ['https://blog.dada.li/2019/better-proxy-rules-for-apple-services', '苹果服务的连接策略推荐']
          ]
        },
      ],
    },
  },
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-146417304-1'
      },
    ],
    [
      'vuepress-plugin-sitemap',
      {
        hostname: 'https://surgio.royli.dev',
      },
    ],
  ]
};
