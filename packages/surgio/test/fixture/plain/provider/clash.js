'use strict'

module.exports = {
  url: 'http://example.com/clash-sample.yaml',
  type: 'clash',
  nodeFilter: (nodeConfig) => nodeConfig.type === 'shadowsocks',
}
