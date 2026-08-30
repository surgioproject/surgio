import { describe, expect, test, vi } from 'vitest'

import { parseV2rayNSubscription } from '../../provider/v2rayn-subscription.js'
import { NodeTypeEnum } from '../../types.js'
import {
  VlessNodeConfigValidator,
  VmessNodeConfigValidator,
} from '../../validators/index.js'
import { fromBase64, fromUrlSafeBase64 } from '../portable.js'
import { getV2rayNNodes } from '../v2rayn.js'

import type {
  PossibleNodeConfigType,
  VlessNodeConfig,
  VmessNodeConfig,
} from '../../types.js'

const createLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})

const nodes: PossibleNodeConfigType[] = [
  {
    type: NodeTypeEnum.Vmess,
    nodeName: 'vmess node',
    hostname: 'vmess.example.com',
    port: 443,
    method: 'auto',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    alterId: '0',
    network: 'ws',
    wsOpts: { path: '/ws', headers: { Host: 'cdn.example.com' } },
    tls: true,
    sni: 'vmess.example.com',
    alpn: ['h2', 'http/1.1'],
    clientFingerprint: 'chrome',
    serverCertFingerprintSha256: 'vmess-cert',
    skipCertVerify: true,
  },
  {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss node',
    hostname: 'ss.example.com',
    port: 8388,
    method: 'aes-128-gcm',
    password: 'ss password',
    obfs: 'wss',
    obfsHost: 'plugin.example.com',
    obfsUri: '/plugin;a=b',
  },
  {
    type: NodeTypeEnum.Socks5,
    nodeName: 'socks node',
    hostname: 'socks.example.com',
    port: 1080,
    username: 'socks user',
    password: 'socks password',
  },
  {
    type: NodeTypeEnum.Vless,
    nodeName: 'vless node',
    hostname: 'vless.example.com',
    port: 443,
    method: 'none',
    uuid: '2386f85e-657b-4d6e-9d56-78badb75e1fd',
    encryption: 'none',
    flow: 'xtls-rprx-vision',
    network: 'xhttp',
    xhttpOpts: {
      path: '/xhttp',
      host: 'xhttp.example.com',
      mode: 'auto',
      extra: '{"noGRPCHeader":true}',
    },
    sni: 'vless.example.com',
    alpn: ['h2'],
    clientFingerprint: 'chrome',
    serverCertFingerprintSha256: 'vless-cert',
    realityOpts: {
      publicKey: 'reality-public-key',
      shortId: '0123456789abcdef',
      spiderX: '/',
    },
  },
  {
    type: NodeTypeEnum.Trojan,
    nodeName: 'trojan node',
    hostname: 'trojan.example.com',
    port: 443,
    password: 'trojan password',
    network: 'ws',
    wsPath: '/trojan',
    wsHeaders: { Host: 'trojan-cdn.example.com' },
    sni: 'trojan.example.com',
    alpn: ['h2'],
    clientFingerprint: 'chrome',
    serverCertFingerprintSha256: 'trojan-cert',
    skipCertVerify: true,
  },
  {
    type: NodeTypeEnum.Hysteria2,
    nodeName: 'hy2 node',
    hostname: 'hy2.example.com',
    port: 443,
    password: 'hy2 password',
    sni: 'hy2.example.com',
    alpn: ['h3'],
    serverCertFingerprintSha256: 'hy2-cert',
    skipCertVerify: true,
    obfs: 'salamander',
    obfsPassword: 'obfs password',
    portHopping: '2000-3000',
  },
  {
    type: NodeTypeEnum.Tuic,
    nodeName: 'tuic node',
    hostname: 'tuic.example.com',
    port: 443,
    uuid: '3386f85e-657b-4d6e-9d56-78badb75e1fd',
    password: 'tuic password',
    version: 5,
    congestionControl: 'bbr',
    sni: 'tuic.example.com',
    alpn: ['h3'],
    skipCertVerify: true,
  },
  {
    type: NodeTypeEnum.Wireguard,
    nodeName: 'wireguard node',
    selfIp: '172.16.0.2',
    selfIpV6: 'fd00::2',
    privateKey: 'wireguard-private-key',
    mtu: 1280,
    dnsServers: ['1.1.1.1', '2606:4700:4700::1111'],
    peers: [
      {
        publicKey: 'wireguard-public-key',
        presharedKey: 'wireguard-preshared-key',
        reservedBits: [1, 2, 3],
        endpoint: '[2001:db8::1]:51820',
      },
    ],
  },
  {
    type: NodeTypeEnum.AnyTLS,
    nodeName: 'anytls node',
    hostname: 'anytls.example.com',
    port: 443,
    password: 'anytls password',
    sni: 'anytls.example.com',
    alpn: ['h2'],
    clientFingerprint: 'chrome',
    serverCertFingerprintSha256: 'anytls-cert',
    skipCertVerify: true,
    realityOpts: {
      publicKey: 'anytls-public-key',
      shortId: 'abcdef',
    },
  },
  {
    type: NodeTypeEnum.HTTP,
    nodeName: 'http node',
    hostname: 'http.example.com',
    port: 8080,
    username: 'http user',
    password: 'http password',
  },
  {
    type: NodeTypeEnum.HTTPS,
    nodeName: 'https node',
    hostname: 'https.example.com',
    port: 8443,
    username: 'https user',
    password: 'https password',
    sni: 'https.example.com',
    alpn: ['h2'],
    clientFingerprint: 'chrome',
    serverCertFingerprintSha256: 'https-cert',
    skipCertVerify: true,
  },
]

test('serializes every node type accepted by the v2rayN parser', () => {
  const logger = createLogger()
  const output = getV2rayNNodes(nodes, undefined, { logger })
  const lines = output.split('\n')

  expect(lines.map((line) => line.slice(0, line.indexOf('://')))).toEqual([
    'vmess',
    'ss',
    'socks',
    'vless',
    'trojan',
    'hysteria2',
    'tuic',
    'wireguard',
    'anytls',
    'v2rayn',
    'v2rayn',
  ])
  expect(logger.warn).not.toHaveBeenCalled()

  const vmess = JSON.parse(fromBase64(lines[0].slice('vmess://'.length)))
  expect(vmess).toMatchObject({
    net: 'ws',
    path: '/ws',
    host: 'cdn.example.com',
    insecure: '1',
    pcs: 'vmess-cert',
  })

  const vless = new URL(lines[3])
  expect(Object.fromEntries(vless.searchParams)).toMatchObject({
    type: 'xhttp',
    security: 'reality',
    pbk: 'reality-public-key',
    pcs: 'vless-cert',
  })

  const wireguard = new URL(lines[7])
  expect(Object.fromEntries(wireguard.searchParams)).toMatchObject({
    publickey: 'wireguard-public-key',
    address: '172.16.0.2/32,fd00::2/128',
    dns: '1.1.1.1,2606:4700:4700::1111',
  })

  const httpProfile = JSON.parse(
    fromUrlSafeBase64(lines[9].slice('v2rayn://http/'.length)),
  )
  const httpsProfile = JSON.parse(
    fromUrlSafeBase64(lines[10].slice('v2rayn://http/'.length)),
  )
  expect(httpProfile).toMatchObject({ ConfigVersion: 4, ConfigType: 10 })
  expect(httpsProfile).toMatchObject({
    ConfigVersion: 4,
    ConfigType: 10,
    StreamSecurity: 'tls',
    CertSha: 'https-cert',
  })
})

test('round-trips every emitted node type through the subscription parser', () => {
  const logger = createLogger()
  const parsed = parseV2rayNSubscription(
    getV2rayNNodes(nodes, undefined, { logger }),
    { logger },
  )
  const byName = new Map(parsed.map((node) => [node.nodeName, node]))

  expect(parsed).toHaveLength(nodes.length)
  expect(parsed.map((node) => node.type)).toEqual(
    nodes.map((node) => node.type),
  )
  expect(byName.get('vmess node')).toMatchObject({
    type: NodeTypeEnum.Vmess,
    network: 'ws',
    skipCertVerify: true,
    serverCertFingerprintSha256: 'vmess-cert',
  })
  expect(byName.get('ss node')).toMatchObject({
    type: NodeTypeEnum.Shadowsocks,
    obfs: 'wss',
    obfsUri: '/plugin;a=b',
  })
  expect(byName.get('vless node')).toMatchObject({
    type: NodeTypeEnum.Vless,
    network: 'xhttp',
    serverCertFingerprintSha256: 'vless-cert',
    realityOpts: { publicKey: 'reality-public-key' },
  })
  expect(byName.get('tuic node')).toMatchObject({
    type: NodeTypeEnum.Tuic,
    version: 5,
    uuid: '3386f85e-657b-4d6e-9d56-78badb75e1fd',
    password: 'tuic password',
  })
  expect(byName.get('wireguard node')).toMatchObject({
    type: NodeTypeEnum.Wireguard,
    selfIp: '172.16.0.2',
    selfIpV6: 'fd00::2',
    dnsServers: ['1.1.1.1', '2606:4700:4700::1111'],
    peers: [{ endpoint: '[2001:db8::1]:51820' }],
  })
  expect(byName.get('https node')).toMatchObject({
    type: NodeTypeEnum.HTTPS,
    skipCertVerify: true,
    serverCertFingerprintSha256: 'https-cert',
  })
  expect(logger.warn).not.toHaveBeenCalled()
})

describe('transport coverage', () => {
  const createVmess = (
    network: VmessNodeConfig['network'],
    options: Record<string, unknown> = {},
  ): VmessNodeConfig =>
    VmessNodeConfigValidator.parse({
      type: NodeTypeEnum.Vmess,
      nodeName: `vmess-${network}`,
      hostname: 'vmess.example.com',
      port: 443,
      method: 'auto',
      uuid: '4386f85e-657b-4d6e-9d56-78badb75e1fd',
      network,
      tls: true,
      ...options,
    })

  const createVless = (
    network: VlessNodeConfig['network'],
    options: Record<string, unknown> = {},
  ): VlessNodeConfig =>
    VlessNodeConfigValidator.parse({
      type: NodeTypeEnum.Vless,
      nodeName: `vless-${network}`,
      hostname: 'vless.example.com',
      port: 443,
      method: 'none',
      uuid: '5386f85e-657b-4d6e-9d56-78badb75e1fd',
      encryption: 'none',
      network,
      ...options,
    })

  test('round-trips every supported VMess and VLESS transport', () => {
    const vmessNodes = [
      createVmess('tcp'),
      createVmess('http', {
        httpOpts: { path: ['/http'], method: 'GET', headers: { Host: 'h' } },
      }),
      createVmess('ws', { wsOpts: { path: '/ws' } }),
      createVmess('h2', { h2Opts: { path: '/h2', host: ['h2'] } }),
      createVmess('grpc', { grpcOpts: { serviceName: 'grpc' } }),
      createVmess('quic', { quicOpts: {} }),
      createVmess('httpupgrade', {
        httpUpgradeOpts: { path: '/upgrade', host: 'upgrade' },
      }),
    ]
    const vlessNodes = [
      createVless('tcp'),
      createVless('http', {
        httpOpts: { path: ['/http'], method: 'GET', headers: { Host: 'h' } },
      }),
      createVless('ws', { wsOpts: { path: '/ws' } }),
      createVless('h2', { h2Opts: { path: '/h2', host: ['h2'] } }),
      createVless('grpc', { grpcOpts: { serviceName: 'grpc' } }),
      createVless('quic', { quicOpts: {} }),
      createVless('httpupgrade', {
        httpUpgradeOpts: { path: '/upgrade', host: 'upgrade' },
      }),
      createVless('xhttp', {
        xhttpOpts: { path: '/xhttp', host: 'xhttp', mode: 'auto' },
      }),
    ]
    const input = [...vmessNodes, ...vlessNodes]
    const parsed = parseV2rayNSubscription(getV2rayNNodes(input))

    expect(
      parsed.map((node) => ('network' in node ? node.network : null)),
    ).toEqual(input.map((node) => node.network))
  })
})

test('supports TUIC v4 tokens', () => {
  const output = getV2rayNNodes([
    {
      type: NodeTypeEnum.Tuic,
      nodeName: 'tuic v4',
      hostname: 'tuic.example.com',
      port: 443,
      token: 'legacy:token',
      congestionControl: 'bbr',
    },
  ])

  expect(parseV2rayNSubscription(output)).toMatchObject([
    {
      type: NodeTypeEnum.Tuic,
      nodeName: 'tuic v4',
      token: 'legacy:token',
      congestionControl: 'bbr',
    },
  ])
})

test('filters disabled nodes and reports unsupported or lossy nodes once', () => {
  const logger = createLogger()
  const output = getV2rayNNodes(
    [
      {
        type: NodeTypeEnum.Hysteria2,
        nodeName: 'lossy hy2',
        hostname: 'hy2.example.com',
        port: 443,
        password: 'password',
        uploadBandwidth: 100,
        downloadBandwidth: 200,
      },
      {
        type: NodeTypeEnum.HTTP,
        nodeName: 'lossy http',
        hostname: 'http.example.com',
        port: 8080,
        path: '/proxy',
        headers: { Authorization: 'secret' },
      },
      {
        type: NodeTypeEnum.Snell,
        nodeName: 'unsupported snell',
        hostname: 'snell.example.com',
        port: 443,
        psk: 'psk',
      },
      {
        type: NodeTypeEnum.Vmess,
        nodeName: 'disabled vmess',
        hostname: 'vmess.example.com',
        port: 443,
        method: 'auto',
        uuid: '6386f85e-657b-4d6e-9d56-78badb75e1fd',
        network: 'tcp',
        enable: false,
      },
    ],
    (node) => node.nodeName !== 'lossy http',
    { logger },
  )

  expect(output.split('\n')).toHaveLength(1)
  expect(output).toContain('hysteria2://')
  expect(output).not.toContain('disabled')
  expect(logger.warn).toHaveBeenCalledTimes(2)
  expect(logger.warn.mock.calls[0][0]).toContain(
    'uploadBandwidth, downloadBandwidth',
  )
  expect(logger.warn.mock.calls[1][0]).toContain('unsupported snell')
})

test('aggregates lossy fields into one warning per emitted node', () => {
  const logger = createLogger()
  const socks = nodes.find((node) => node.type === NodeTypeEnum.Socks5)!
  const hysteria2 = nodes.find((node) => node.type === NodeTypeEnum.Hysteria2)!
  const wireguard = nodes.find((node) => node.type === NodeTypeEnum.Wireguard)!
  const anytls = nodes.find((node) => node.type === NodeTypeEnum.AnyTLS)!
  const http = nodes.find((node) => node.type === NodeTypeEnum.HTTP)!

  const output = getV2rayNNodes(
    [
      { ...socks, tls: true, clientCert: 'client cert' },
      { ...hysteria2, uploadBandwidth: 100, downloadBandwidth: 200 },
      {
        ...wireguard,
        peers: [
          ...wireguard.peers,
          {
            publicKey: 'second-public-key',
            endpoint: 'second.example.com:51820',
          },
        ],
      },
      { ...anytls, idleSessionTimeout: 30, reuse: true },
      { ...http, path: '/proxy', headers: { Authorization: 'secret' } },
    ],
    undefined,
    { logger },
  )

  expect(output.split('\n')).toHaveLength(5)
  expect(logger.warn).toHaveBeenCalledTimes(5)
  expect(logger.warn.mock.calls.map(([message]) => message)).toEqual([
    expect.stringContaining('tls, clientCert'),
    expect.stringContaining('uploadBandwidth, downloadBandwidth'),
    expect.stringContaining('peers[1..]'),
    expect.stringContaining('idleSessionTimeout, reuse'),
    expect.stringContaining('path, headers'),
  ])
})
