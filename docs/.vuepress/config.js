module.exports = {
  locales: {
    '/': {
      lang: 'zh-CN',
      title: 'Surgio',
      description: '一站式各类代理规则生成器',
    }
  },
  themeConfig: {
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
            '0.x-to-1.0',
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
          ]
        },
        {
          title: '进阶',
          collapsable: false,
          children: [
            'advance/surge-advance',
            'advance/custom-filter',
            'advance/automation',
            'advance/api-gateway'
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
      }
    ]
  ]
};
