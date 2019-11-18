'use strict';

const { utils } = require('../../../');

module.exports = {
  artifacts: [
    {
      name: 'ss.conf',
      template: 'test',
      provider: 'ss',
      proxyGroupModifier(nodeList, filters) {
        return [
          {
            name: 'global filter',
            filter: filters.globalKeywordFilter,
            type: 'select',
          },
          {
            name: 'provider filter',
            filter: filters.keywordFilter,
            type: 'select',
          },
          {
            name: 'sort filter',
            filter: filters.sortFilter,
            type: 'select',
          },
        ];
      },
    },
  ],
  urlBase: 'https://example.com/',
  binPath: {
    shadowsocksr: '/usr/local/bin/ssr-local',
    v2ray: '/usr/local/bin/v2ray',
  },
  customFilters: {
    globalKeywordFilter: utils.useKeywords(['US 1']),
    sortFilter: utils.useSortedKeywords(['🇺🇸US 2', '🇺🇸US 1']),
  },
};
