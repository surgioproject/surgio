'use strict'

const { defineClashProvider } = require('surgio')

/**
 * 这是一个能够成功的实例，它会从远程获取 Clash 配置
 */
module.exports = defineClashProvider({
  url: 'https://raw.githubusercontent.com/surgioproject/surgio/master/test/asset/clash-sample.yaml',
  type: 'clash',
  udpRelay: true,
  addFlag: true,
  hooks: {
    afterNodeListResponse: async (nodeList, customParams) => {
      if (customParams.requestUserAgent?.toLowerCase().includes('surge')) {
        // 假如是 Surge 请求则在末尾插入一个我自己维护的节点
        nodeList.push({
          type: 'shadowsocks',
          nodeName: 'US 自定义节点',
          hostname: 'example.com',
          port: 8388,
          method: 'chacha20-ietf-poly1305',
          password: 'password',
        })
      }

      return nodeList
    },
  },
})
