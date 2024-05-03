import { defineUserConfig, type HeadConfig, type PluginConfig, type UserConfig } from 'vuepress'
import { path } from '@vuepress/utils'
import { docsearchPlugin } from '@vuepress/plugin-docsearch'
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import { sitemapPlugin } from '@vuepress/plugin-sitemap'
import { umamiAnalyticsPlugin } from 'vuepress-plugin-umami-analytics'
import { viteBundler } from '@vuepress/bundler-vite'

import customTheme from './theme'

const meta = {
  title: 'Surgio',
  description: '一站式各类代理规则生成器',
  url: 'https://surgio.js.org',
  icon: 'https://surgio.js.org/surgio-square.png',
  favicon: 'https://surgio.js.org/favicon-96x96.png',
}

const head: HeadConfig[] = [
  [
    'link',
    {
      href: 'https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600|Roboto Mono',
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
    },
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
]

const plugins: PluginConfig = [
  registerComponentsPlugin({
    componentsDir: path.resolve(__dirname, './components'),
  }),
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(
    docsearchPlugin({
      appId: 'AXEPS6U765',
      apiKey: 'c7282707083d364aceb47ba33e14d5ab',
      indexName: 'surgio',
    }),
    sitemapPlugin({
      hostname: 'https://surgio.js.org',
    }),
    umamiAnalyticsPlugin({
      id: '444a5a25-af75-4c30-b7a4-6aaba520daf6',
      src: 'https://sashimi.royli.dev/sashimi.js',
      domains: ['surgio.js.org'],
      cache: true,
    }),
  )
}

export default defineUserConfig({
  bundler: viteBundler(),
  theme: customTheme,
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
  plugins,
}) as UserConfig
