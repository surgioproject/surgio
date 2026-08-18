import { defineCustomProvider, NodeTypeEnum } from 'surgio/project'

export default defineCustomProvider({
  nodeList: [
    {
      nodeName: '🇺🇸US',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'us.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'surgio',
      obfs: 'tls',
      obfsHost: 'world.taobao.com',
      udpRelay: true,
    },
    {
      nodeName: '🇭🇰HK Netflix',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'hk.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'surgio',
      obfs: 'tls',
      obfsHost: 'world.taobao.com',
      udpRelay: true,
    },
  ],
})
