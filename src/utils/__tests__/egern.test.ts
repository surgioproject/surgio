import test from 'ava'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types'
import { getEgernNodeNames, getEgernNodes } from '../egern'

const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
  {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss',
    hostname: 'ss.example.com',
    port: 8388,
    method: 'aes-256-gcm',
    password: 'password',
    tfo: true,
    udpRelay: true,
    underlyingProxy: 'front',
  },
  {
    type: NodeTypeEnum.Vmess,
    nodeName: 'vmess-wss',
    hostname: 'vmess.example.com',
    port: 443,
    method: 'auto',
    uuid: '00000000-0000-0000-0000-000000000000',
    network: 'ws',
    tls: true,
    sni: 'sni.example.com',
    skipCertVerify: true,
    wsOpts: {
      path: '/ws',
      headers: { Host: 'host.example.com' },
    },
  },
  {
    type: NodeTypeEnum.Wireguard,
    nodeName: 'wireguard',
    selfIp: '172.16.0.2',
    selfIpV6: 'fd01:5ca1:ab1e::2',
    privateKey: 'private-key',
    mtu: 1280,
    peers: [
      {
        endpoint: 'engage.cloudflareclient.com:2408',
        publicKey: 'public-key',
        presharedKey: 'preshared-key',
        reservedBits: [1, 2, 3],
        keepalive: 25,
      },
    ],
  },
  {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName: 'unsupported',
    hostname: 'ssr.example.com',
    port: 443,
    method: 'aes-256-cfb',
    password: 'password',
    protocol: 'origin',
    protoparam: '',
    obfs: 'plain',
    obfsparam: '',
  },
  {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'disabled',
    enable: false,
    hostname: 'disabled.example.com',
    port: 443,
    method: 'aes-256-gcm',
    password: 'password',
  },
]

test('getEgernNodes', (t) => {
  t.deepEqual(getEgernNodes(nodeList), [
    {
      shadowsocks: {
        name: 'ss',
        server: 'ss.example.com',
        port: 8388,
        method: 'aes-256-gcm',
        password: 'password',
        tfo: true,
        udp_relay: true,
        prev_hop: 'front',
      },
    },
    {
      vmess: {
        name: 'vmess-wss',
        server: 'vmess.example.com',
        port: 443,
        user_id: '00000000-0000-0000-0000-000000000000',
        security: 'auto',
        transport: {
          wss: {
            path: '/ws',
            headers: { Host: 'host.example.com' },
            sni: 'sni.example.com',
            skip_tls_verify: true,
          },
        },
      },
    },
    {
      wireguard: {
        name: 'wireguard',
        server: 'engage.cloudflareclient.com',
        port: 2408,
        private_key: 'private-key',
        peer_public_key: 'public-key',
        preshared_key: 'preshared-key',
        reserved: [1, 2, 3],
        local_ipv4: '172.16.0.2/32',
        local_ipv6: 'fd01:5ca1:ab1e::2/128',
        mtu: 1280,
        keepalive: 25,
      },
    },
  ])
})

test('getEgernNodeNames', (t) => {
  t.deepEqual(getEgernNodeNames(nodeList), ['ss', 'vmess-wss', 'wireguard'])
  t.deepEqual(
    getEgernNodeNames(nodeList, (node) => node.nodeName === 'ss'),
    ['ss'],
  )
})
