import {
  defineUserConfig,
  type HeadConfig,
  type PluginConfig,
  type UserConfig,
} from 'vuepress'
import { path } from '@vuepress/utils'
import { docsearchPlugin } from '@vuepress/plugin-docsearch'
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import { sitemapPlugin } from '@vuepress/plugin-sitemap'
import { viteBundler } from '@vuepress/bundler-vite'
import { shikiPlugin } from '@vuepress/plugin-shiki'

import customTheme from './theme'

const meta = {
  title: 'Surgio',
  description: '一站式各类代理规则生成器',
  url: 'https://v3.surgio.royli.dev',
  icon: 'https://v3.surgio.royli.dev/surgio-square.png',
  favicon: 'https://v3.surgio.royli.dev/favicon-96x96.png',
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
  shikiPlugin({
    // 配置项
    langs: [
      'ts',
      'json',
      'bash',
      'shell',
      'yaml',
      'js',
      'json5',
      'html',
      'ini',
      'toml',
      'md',
    ],
  }),
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(
    docsearchPlugin({
      appId: 'AXEPS6U765',
      apiKey: '9987cb0d8c6c1c71153213dd9d5bc703',
      indexName: 'surgio-v3',
    }),
    sitemapPlugin({
      hostname: 'https://v3.surgio.royli.dev',
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
