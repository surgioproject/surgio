'use strict';

module.exports = {
  type: 'custom',
  addFlag: true,
  nodeList: [
    {
      type: 'shadowsocks',
      nodeName: 'V01 HK 1',
      hostname: 'us.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      udpRelay: true,
      obfs: 'tls',
      obfsHost: 'gateway-carry.icloud.com',
      tfo: true,
    },
    {
      type: 'shadowsocks',
      nodeName: 'V01 HK 2',
      hostname: 'us.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      udpRelay: true,
      obfs: 'tls',
      obfsHost: 'gateway-carry.icloud.com',
      tfo: true,
    },
    {
      type: 'shadowsocks',
      nodeName: 'V03 US',
      hostname: 'us.example.com',
      port: '443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      udpRelay: true,
      obfs: 'tls',
      obfsHost: 'gateway-carry.icloud.com',
      tfo: true,
    },
  ],
};
