import { defineClashProvider, NodeTypeEnum } from 'surgio/project'

import type { PossibleNodeConfigInputType } from 'surgio/project'

/**
 * 这是一个能够成功的实例，它会从远程获取 Clash 配置
 */
export default defineClashProvider({
  url: 'https://raw.githubusercontent.com/surgioproject/surgio/master/test/asset/clash-sample.yaml',
  udpRelay: true,
  addFlag: true,
  hooks: {
    afterNodeListResponse: async (nodeList, customParams) => {
      if (customParams.requestUserAgent?.toLowerCase().includes('surge')) {
        const mutableNodeList: PossibleNodeConfigInputType[] = nodeList

        // 假如是 Surge 请求则在末尾插入一个我自己维护的节点
        mutableNodeList.push({
          type: NodeTypeEnum.Shadowsocks,
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
