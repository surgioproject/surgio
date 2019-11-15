'use strict';

const sinon = require('sinon');
const { utils } = require('../../../');

exports.globalKeywordFilter = sinon.spy(utils.useKeywords(['US 1']));

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
    globalKeywordFilter: exports.globalKeywordFilter,
  },
};
