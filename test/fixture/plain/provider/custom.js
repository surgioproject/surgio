'use strict';

module.exports = {
  type: 'custom',
  nodeList: [
    {
      type: 'shadowsocks',
      nodeName: 'US',
      hostname: 'us.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      'udp-relay': 'true',
      obfs: 'tls',
      'obfs-host': 'gateway-carry.icloud.com',
    },
    {
      type: 'snell',
      nodeName: 'Snell',
      hostname: 'us.example.com',
      port: '443',
      psk: 'password',
      obfs: 'tls',
    },
    {
      type: 'https',
      nodeName: 'HTTPS',
      hostname: 'us.example.com',
      port: '443',
      username: 'username',
      password: 'password',
    },
  ],
};
