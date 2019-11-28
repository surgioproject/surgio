module.exports = {
  locales: {
    '/': {
      lang: 'zh-CN',
      title: 'Surgio',
      description: '一站式各类代理规则生成器',
    }
  },
  themeConfig: {
    algolia: {
      apiKey: '6e7242cfd891a169eb12749ab473ba8f',
      indexName: 'surgio',
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
            'api',
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
