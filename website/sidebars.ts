import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: '指南',
      collapsed: false,
      items: [
        'guide',
        'guide/getting-started',
        {
          type: 'category',
          label: '自定义',
          items: [
            'guide/custom-config',
            'guide/custom-provider',
            'guide/custom-template',
            'guide/custom-artifact',
          ],
        },
        {
          type: 'category',
          label: '客户端规则维护指南',
          items: [
            'guide/client/sing-box',
            'guide/client/clash',
            'guide/client/examples',
          ],
        },
        'guide/api',
        'guide/worker',
        'guide/cli',
        'guide/faq',
        'guide/upgrade-guide-v2',
        'guide/upgrade-guide-v3',
        'guide/upgrade-guide-v4',
        'guide/learning-resources',
      ],
    },
    {
      type: 'category',
      label: '进阶',
      collapsed: false,
      items: [
        'guide/advance/custom-filter',
        'guide/advance/advanced-provider',
        'guide/advance/automation',
        {
          type: 'category',
          label: '快速搭建托管 API',
          items: [
            'guide/advance/api-gateway',
            'guide/advance/api-gateway/zeabur',
            'guide/advance/api-gateway/netlify',
            'guide/advance/api-gateway/railway',
            'guide/advance/api-gateway/vercel',
            'guide/advance/api-gateway/docker',
          ],
        },
        'guide/advance/upstash-cache',
        {
          type: 'link',
          label: '苹果服务的连接策略推荐',
          href: 'https://royli.dev/blog/2019/better-proxy-rules-for-apple-services',
        },
      ],
    },
  ],
}

export default sidebars
