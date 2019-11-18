'use strict';

const { utils } = require('../../../../');

exports.keywordFilter = utils.useKeywords(['US 1', 'US 2']);
exports.strictKeywordFilter = utils.useKeywords(['US', 'Netflix'], true);

module.exports = {
  url: 'http://example.com/test-ss-sub.txt',
  type: 'shadowsocks_subscribe',
  customFilters: {
    keywordFilter: exports.keywordFilter,
    strictKeywordFilter: exports.strictKeywordFilter,
  },
};
