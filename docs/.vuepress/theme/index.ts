import { defaultTheme } from '@vuepress/theme-default'
import type { Theme } from 'vuepress'

export default {
  name: 'custom-theme',
  extends: defaultTheme({
    docsRepo: 'geekdada/surgio',
    docsBranch: 'master',
    repo: 'geekdada/surgio',
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
            children: ['/guide/client/sing-box', '/guide/client/clash', '/guide/client/examples'],
          },
          '/guide/api',
          '/guide/cli',
          '/guide/faq',
          '/guide/upgrade-guide-v2',
          '/guide/upgrade-guide-v3',
          '/guide/learning-resources',
        ],
      },
      {
        text: '进阶',
        children: [
          '/guide/advance/surge-advance',
          '/guide/advance/custom-filter',
          '/guide/advance/advanced-provider',
          '/guide/advance/automation',
          {
            text: '快速搭建托管 API',
            children: [
              '/guide/advance/api-gateway',
              '/guide/advance/api-gateway/zeabur',
              '/guide/advance/api-gateway/netlify',
              '/guide/advance/api-gateway/railway',
              '/guide/advance/api-gateway/vercel',
            ],
          },
          '/guide/advance/redis-cache',
          {
            link: 'https://royli.dev/blog/2019/better-proxy-rules-for-apple-services',
            text: '苹果服务的连接策略推荐'
          }
        ],
      },
    ],
  }),
} as Theme;
