'use strict';

const sinon = require('sinon');
const { utils } = require('../../../../');

exports.keywordFilter = sinon.spy(utils.useKeywords(['US 1', 'US 2']));
exports.strictKeywordFilter = sinon.spy(utils.useKeywords(['US', 'Netflix'], true));

module.exports = {
  url: 'http://example.com/test-ss-sub.txt',
  type: 'shadowsocks_subscribe',
  customFilters: {
    keywordFilter: exports.keywordFilter,
    strictKeywordFilter: exports.strictKeywordFilter,
  },
};
