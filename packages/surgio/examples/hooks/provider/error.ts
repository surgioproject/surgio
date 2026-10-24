import { defineClashProvider, NodeTypeEnum } from 'surgio/project'

/**
 * 这是一个一定会失败的示例
 */
export default defineClashProvider({
  url: 'https://raw.githubusercontent.com/surgioproject/surgio/master/test/asset/not-exist.yaml',
  udpRelay: true,
  addFlag: true,
  hooks: {
    onError: async () => {
      return [
        {
          nodeName: 'Fallback',
          type: NodeTypeEnum.Shadowsocks,
          hostname: 'fallback.example.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'password',
        },
      ]
    },
  },
})
