'use strict';

const { utils } = require('../../../');

module.exports = {
  artifacts: [
    {
      name: 'ss.conf',
      template: 'test',
      provider: 'ss',
    },
    {
      name: 'test_sorted_filter.conf',
      template: 'test2',
      provider: 'ss2',
      combineProviders: ['custom'],
    },
  ],
  urlBase: 'http://example.com/',
  binPath: {
    shadowsocksr: '/usr/local/bin/ssr-local',
    v2ray: '/usr/local/bin/v2ray',
  },
  customFilters: {
    globalKeywordFilter: utils.useKeywords(['US 1']),
    sortFilter: utils.useSortedKeywords(['🇺🇸US 2', '🇺🇸US 1']),
    hkFirstUsSecondFilter: utils.mergeSortedFilters([
      utils.hkFilter,
      utils.usFilter,
    ]),
    providerFilter: utils.useProviders(['custom']),
  },
};
