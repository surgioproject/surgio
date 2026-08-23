import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import { themes as prismThemes } from 'prism-react-renderer'

const isProduction = process.env.NODE_ENV === 'production'

const config: Config = {
  title: 'Surgio',
  tagline: '一站式各类代理规则生成器',
  favicon: 'favicon.ico',
  url: 'https://surgio.js.org',
  baseUrl: '/',
  trailingSlash: false,
  organizationName: 'surgioproject',
  projectName: 'surgio',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  staticDirectories: ['static'],
  future: {
    v4: true,
  },
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
    localeConfigs: {
      'zh-Hans': {
        label: '简体中文',
        htmlLang: 'zh-CN',
      },
    },
  },
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
      onBrokenMarkdownImages: 'throw',
    },
  },
  scripts: [
    {
      src: 'https://buttons.github.io/buttons.js',
      async: true,
      defer: true,
    },
    ...(isProduction
      ? [
          {
            src: 'https://sashimi.royli.dev/sashimi.js',
            async: true,
            defer: true,
            'data-website-id': '444a5a25-af75-4c30-b7a4-6aaba520daf6',
            'data-domains': 'surgio.js.org',
            'data-cache': 'true',
          },
        ]
      : []),
  ],
  presets: [
    [
      'classic',
      {
        blog: false,
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/geekdada/surgio/edit/master/docs/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        pages: {
          path: 'src/pages',
          routeBasePath: '/',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'surgio-square.png',
    metadata: [
      {
        name: 'description',
        content: '一站式各类代理规则生成器',
      },
      {
        property: 'og:site_name',
        content: 'Surgio',
      },
    ],
    navbar: {
      title: 'Surgio',
      logo: {
        alt: 'Surgio',
        src: 'surgio-square.png',
      },
      items: [
        {
          to: '/guide',
          label: '指南',
          position: 'left',
        },
        {
          href: 'https://github.com/surgioproject/surgio/releases',
          label: 'Changelog',
          position: 'right',
        },
        {
          href: 'https://github.com/geekdada/surgio',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '指南',
              to: '/guide',
            },
            {
              label: '支持开发',
              to: '/support',
            },
          ],
        },
        {
          title: '项目',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/geekdada/surgio',
            },
            {
              label: 'Changelog',
              href: 'https://github.com/surgioproject/surgio/releases',
            },
          ],
        },
      ],
      copyright: `MIT Licensed | Copyright © 2019-${new Date().getFullYear()} Surgio`,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    algolia: {
      appId: 'AXEPS6U765',
      apiKey: 'c7282707083d364aceb47ba33e14d5ab',
      indexName: 'surgio',
      contextualSearch: false,
      placeholder: '搜索文档',
      translations: {
        modal: {
          searchBox: {
            clearButtonTitle: '清除查询',
            clearButtonAriaLabel: '清除查询',
            closeButtonText: '取消',
            closeButtonAriaLabel: '关闭搜索',
            placeholderText: '搜索文档',
            searchInputLabel: '搜索',
          },
          footer: {
            selectText: '选择',
            navigateText: '导航',
            closeText: '关闭',
            poweredByText: '搜索由',
          },
          errorScreen: {
            titleText: '无法获取搜索结果',
            helpText: '请检查网络连接后重试。',
          },
          noResultsScreen: {
            noResultsText: '没有找到相关结果',
            suggestedQueryText: '试试搜索',
          },
          startScreen: {
            recentSearchesTitle: '最近搜索',
            noRecentSearchesText: '暂无最近搜索',
            favoriteSearchesTitle: '收藏的搜索',
          },
        },
      },
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['ini', 'json5', 'toml'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
