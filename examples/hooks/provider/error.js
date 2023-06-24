'use strict'

const { defineClashProvider } = require('surgio')

/**
 * 这是一个一定会失败的示例
 */
module.exports = defineClashProvider({
  url: 'https://raw.githubusercontent.com/surgioproject/surgio/master/test/asset/not-exist.yaml',
  type: 'clash',
  udpRelay: true,
  addFlag: true,
  hooks: {
    onError: async () => {
      return [
        {
          nodeName: 'Fallback',
          type: 'shadowsocks',
          hostname: 'fallback.example.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'password',
        },
      ]
    },
  },
})
