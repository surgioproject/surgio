'use strict';

const { utils } = require('../../../../');

module.exports = {
  url: '/test-ss-sub.txt',
  type: 'shadowsocks_subscribe',
  customFilters: {
    keywordFilter: utils.useKeywords(['US 1', 'US 2']),
    strictKeywordFilter: utils.useKeywords(['US', 'Netflix'], true),
  },
};
