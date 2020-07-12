'use strict';

module.exports = {
  type: 'custom',
  nodeList: [
    {
      nodeName: '🇺🇸US',
      type: 'shadowsocks',
      hostname: 'us.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'surgio',
      obfs: 'tls',
      'obfs-host': 'world.taobao.com',
      'udp-relay': true,
    },
    {
      nodeName: '🇭🇰HK Netflix',
      type: 'shadowsocks',
      hostname: 'hk.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'surgio',
      obfs: 'tls',
      'obfs-host': 'world.taobao.com',
      'udp-relay': true,
    },
  ],
};
