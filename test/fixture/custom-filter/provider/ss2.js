'use strict'

const { utils } = require('../../../../')

module.exports = {
  url: 'http://example.com/test-ss-sub.txt',
  type: 'shadowsocks_subscribe',
  nodeFilter: utils.useSortedKeywords(['US 2', 'US 1']),
}
