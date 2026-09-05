import { expect, test, vi } from 'vitest'

import { NodeTypeEnum } from '../types.js'

import { formatProviderNodes } from './format.js'

test('rejects the removed Shadowsocks JSON output format', () => {
  expect(() => formatProviderNodes('shadowsocks-json' as never, [])).toThrow(
    'Unsupported provider format: shadowsocks-json',
  )
})

test('passes the runtime logger to the v2rayN formatter', () => {
  const warn = vi.fn()
  const output = formatProviderNodes(
    'v2rayn',
    [
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: 'lossy node',
        hostname: 'hy2.example.com',
        port: 443,
        password: 'password',
        uploadBandwidth: 100,
      },
    ],
    undefined,
    {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn,
        error: vi.fn(),
      },
    },
  )

  expect(output).toContain('hysteria2://')
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('uploadBandwidth'))
})

test('places WireGuard nodes in sing-box endpoints', () => {
  const output = JSON.parse(
    formatProviderNodes('singbox', [
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'wireguard',
        selfIp: '10.0.0.2',
        privateKey: 'private-key',
        peers: [
          {
            endpoint: 'wg.example.com:51820',
            publicKey: 'public-key',
          },
        ],
      },
    ]),
  )

  expect(output.outbounds).toEqual([])
  expect(output.endpoints).toEqual([
    {
      type: 'wireguard',
      tag: 'wireguard',
      address: ['10.0.0.2/32'],
      private_key: 'private-key',
      peers: [
        {
          address: 'wg.example.com',
          port: 51820,
          public_key: 'public-key',
          allowed_ips: ['0.0.0.0/0'],
        },
      ],
    },
  ])
})

test('formats AnyTLS fields for sing-box', () => {
  const output = JSON.parse(
    formatProviderNodes('singbox', [
      {
        type: NodeTypeEnum.AnyTLS,
        nodeName: 'anytls',
        hostname: 'anytls.example.com',
        port: 443,
        password: 'password',
        udpRelay: false,
        idleSessionCheckInterval: 0,
        idleSessionTimeout: 30,
        minIdleSessions: 0,
      },
    ]),
  )

  expect(output.outbounds).toEqual([
    {
      type: 'anytls',
      tag: 'anytls',
      server: 'anytls.example.com',
      server_port: 443,
      password: 'password',
      idle_session_check_interval: '0s',
      idle_session_timeout: '30s',
      min_idle_session: 0,
      tls: { enabled: true },
    },
  ])
  expect(output.endpoints).toEqual([])
})
