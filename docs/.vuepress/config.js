module.exports = {
  title: 'Surgio',
  description: '一站式生成各类代理规则',
  themeConfig: {
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
          ]
        },
      ],
    },
  }
}