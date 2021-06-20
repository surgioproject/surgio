'use strict';

module.exports = {
  type: 'custom',
  addFlag: true,
  nodeList: [
    {
      type: 'shadowsocks',
      nodeName: 'US',
      hostname: 'us.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      'udp-relay': true,
      obfs: 'tls',
      'obfs-host': 'gateway-carry.icloud.com',
      tfo: true,
      mptcp: true,
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
      nodeName: 'rename to HTTPS',
      hostname: 'us.example.com',
      port: '443',
      username: 'username',
      password: 'password',
      tfo: true,
      tls13: true,
    },
    {
      type: 'trojan',
      nodeName: 'trojan node',
      hostname: 'trojan.example.com',
      port: '443',
      password: 'password',
    },
    {
      type: 'trojan',
      nodeName: '火箭 trojan node',
      hostname: 'trojan.example.com',
      port: '443',
      password: 'password',
    },
    {
      type: 'trojan',
      nodeName: 'foobar trojan node',
      hostname: 'trojan.example.com',
      port: '443',
      password: 'password',
    },
  ],
  renameNode: (name) => {
    if (name === 'rename to HTTPS') {
      return 'HTTPS';
    }
    return name;
  },
};
