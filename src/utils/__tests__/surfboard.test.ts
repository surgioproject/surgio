import { describe, expect, test, vi } from 'vitest'

import { mergeSortedFilters } from '../../filters/index.js'
import { NodeTypeEnum } from '../../types.js'
import {
  AnyTLSNodeConfigValidator,
  SnellNodeConfigValidator,
  TuicNodeConfigValidator,
} from '../../validators/index.js'
import { SurfboardConfigValidator } from '../../validators/surgio-config.js'
import {
  getSurfboardExtendHeaders,
  getSurfboardNodeNames,
  getSurfboardNodes,
  getSurfboardWireguardNodes,
} from '../surfboard.js'

import type {
  PossibleNodeConfigType,
  WireguardNodeConfig,
} from '../../types.js'

const base = { nodeName: 'proxy', hostname: 'example.com', port: 443 }
const ss = {
  ...base,
  type: NodeTypeEnum.Shadowsocks,
  method: 'aes-128-gcm',
  password: 'secret',
} as const
const vmess = {
  ...base,
  type: NodeTypeEnum.Vmess,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  method: 'auto',
  network: 'tcp',
} as const
const trojan = {
  ...base,
  type: NodeTypeEnum.Trojan,
  password: 'secret',
} as const
const anytls = {
  ...base,
  type: NodeTypeEnum.AnyTLS,
  password: 'secret',
} as const
const hy2 = {
  ...base,
  type: NodeTypeEnum.Hysteria2,
  password: 'secret',
} as const
const tuic = {
  ...base,
  type: NodeTypeEnum.Tuic,
  version: 5,
  uuid: vmess.uuid,
  password: 'secret',
} as const
const snell = { ...base, type: NodeTypeEnum.Snell, psk: 'secret' } as const
const wg: WireguardNodeConfig = {
  type: NodeTypeEnum.Wireguard,
  nodeName: 'wg',
  privateKey: 'private=',
  selfIp: '10.0.0.2',
  peers: [
    {
      publicKey: 'public=',
      endpoint: 'example.com:51820',
      allowedIps: '0.0.0.0/0',
    },
  ],
}
const createOptions = () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
})

const minimalCases: [PossibleNodeConfigType, string][] = [
  [ss, 'ss, example.com, 443, encrypt-method=aes-128-gcm, password=secret'],
  [{ ...base, type: NodeTypeEnum.HTTP }, 'http, example.com, 443'],
  [{ ...base, type: NodeTypeEnum.HTTPS }, 'https, example.com, 443'],
  [{ ...base, type: NodeTypeEnum.Socks5 }, 'socks5, example.com, 443'],
  [
    { ...base, type: NodeTypeEnum.Socks5, tls: true },
    'socks5-tls, example.com, 443',
  ],
  [vmess, `vmess, example.com, 443, username=${vmess.uuid}, vmess-aead=true`],
  [trojan, 'trojan, example.com, 443, password=secret'],
  [hy2, 'hysteria2, example.com, 443, password=secret'],
  [anytls, 'anytls, example.com, 443, password=secret'],
  [tuic, `tuic-v5, example.com, 443, uuid=${vmess.uuid}, password=secret`],
  [snell, 'snell, example.com, 443, psk=secret'],
]

test.each(minimalCases)('minimal $type output', (node, output) => {
  expect(getSurfboardNodes([node])).toBe(`proxy = ${output}`)
  expect(getSurfboardNodeNames([node])).toBe('proxy')
})

test('headers preserve names and values', () => {
  expect(
    getSurfboardExtendHeaders({
      Host: 'cdn.example.com',
      'X-Test': 'two words',
    }),
  ).toBe('Host:cdn.example.com|X-Test:two words')
})

test.each([
  NodeTypeEnum.HTTP,
  NodeTypeEnum.HTTPS,
  NodeTypeEnum.Socks5,
] as const)('%s authentication is positional and quoted', (type) => {
  expect(
    getSurfboardNodes([
      { ...base, type, username: 'user, name', password: 'secret;value' },
    ]),
  ).toBe(`proxy = ${type}, example.com, 443, "user, name", "secret;value"`)
  expect(getSurfboardNodes([{ ...base, type, password: 'secret' }])).toBe(
    `proxy = ${type}, example.com, 443, , secret`,
  )
})

test('chooses a quote delimiter without JSON escapes', () => {
  expect(getSurfboardNodes([{ ...trojan, password: 'say "hello"' }])).toContain(
    `password='say "hello"'`,
  )
  expect(getSurfboardNodes([{ ...trojan, password: 'a\\b' }])).toContain(
    'password="a\\b"',
  )
})

test.each([
  'aes-128-gcm',
  'aes-192-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  'none',
])('Shadowsocks %s and identity passwords', (method) => {
  expect(
    getSurfboardNodes([
      { ...ss, method, password: 'cGFzc3dvcmQ=:aWRlbnRpdHk=' },
    ]),
  ).toContain(`encrypt-method=${method}, password=cGFzc3dvcmQ=:aWRlbnRpdHk=`)
})

test('Shadowsocks simple-obfs, common options and false UDP', () => {
  expect(
    getSurfboardNodes([
      {
        ...ss,
        obfs: 'http',
        obfsHost: 'cdn.example.com',
        obfsUri: '/proxy',
        udpRelay: false,
        underlyingProxy: 'upstream proxy',
        blockQuic: 'off',
      },
    ]),
  ).toBe(
    'proxy = ss, example.com, 443, encrypt-method=aes-128-gcm, password=secret, udp-relay=false, obfs=http, obfs-host=cdn.example.com, obfs-uri=/proxy, underlying-proxy="upstream proxy", block-quic=off',
  )
})

const fingerprint = 'a'.repeat(64)
const tls = {
  sni: 'tls.example.com',
  skipCertVerify: false,
  serverCertFingerprintSha256: `${fingerprint},${'b'.repeat(64)}`,
}

test.each([
  { ...base, type: NodeTypeEnum.HTTPS },
  { ...base, type: NodeTypeEnum.Socks5, tls: true },
  { ...vmess, tls: true },
  trojan,
  hy2,
  anytls,
  tuic,
] satisfies PossibleNodeConfigType[])(
  '$type emits TLS pinning and explicit false',
  (node) => {
    const output = getSurfboardNodes([{ ...node, ...tls }])
    expect(output).toContain('sni=tls.example.com, skip-cert-verify=false')
    expect(output).toContain(
      `server-cert-fingerprint-sha256="${tls.serverCertFingerprintSha256}"`,
    )
  },
)

test.each([
  { ...vmess, tls: false },
  { ...base, type: NodeTypeEnum.Socks5, tls: false },
] satisfies PossibleNodeConfigType[])(
  '$type excludes inactive TLS parameters',
  (node) => {
    expect(getSurfboardNodes([{ ...node, ...tls }])).not.toMatch(
      /sni=|skip-cert-verify=|server-cert-fingerprint/,
    )
  },
)

test('VMess maps encryption and preserves AEAD override', () => {
  expect(
    getSurfboardNodes([
      {
        ...vmess,
        method: 'chacha20-poly1305',
        surfboardConfig: { vmessAEAD: false },
        udpRelay: false,
      },
    ]),
  ).toBe(
    `proxy = vmess, example.com, 443, username=${vmess.uuid}, encrypt-method=chacha20-ietf-poly1305, vmess-aead=false, udp-relay=false`,
  )
  expect(getSurfboardNodes([{ ...vmess, method: 'aes-128-gcm' }])).toContain(
    'encrypt-method=aes-128-gcm',
  )
})

test('WebSocket defaults and custom headers', () => {
  expect(
    getSurfboardNodes([
      {
        ...trojan,
        network: 'ws',
        wsHeaders: { Host: 'cdn.example.com', 'X-Test': 'two words' },
        udpRelay: true,
      },
    ]),
  ).toBe(
    'proxy = trojan, example.com, 443, password=secret, ws=true, ws-path=/, ws-headers="Host:cdn.example.com|X-Test:two words", udp-relay=true',
  )
  const output = getSurfboardNodes([
    {
      ...vmess,
      network: 'ws',
      wsOpts: { path: '/custom', headers: { 'user-agent': 'custom agent' } },
    },
  ])
  expect(output).toContain(
    'ws=true, ws-path=/custom, ws-headers="user-agent:custom agent"',
  )
  expect(getSurfboardNodes([{ ...vmess, network: 'ws' }])).toContain(
    'ws-path=/, ws-headers="user-agent:Mozilla/',
  )
})

test('Hysteria2 bandwidth, hopping, Salamander and Gecko precedence', () => {
  const node = {
    ...hy2,
    downloadBandwidth: 100,
    portHopping: '443,5000-6000',
    portHoppingInterval: 30,
    obfs: 'salamander',
    obfsPassword: 'obfs password',
    udpRelay: false,
  } as const
  expect(getSurfboardNodes([node])).toBe(
    'proxy = hysteria2, example.com, 443, password=secret, download-bandwidth=100, port-hopping="443;5000-6000", port-hopping-interval=30, salamander-password="obfs password", udp-relay=false',
  )
  const geckoOutput = getSurfboardNodes([
    { ...node, surfboardConfig: { geckoPassword: 'gecko' } },
  ])
  expect(geckoOutput).toContain('gecko-password=gecko')
  expect(geckoOutput).not.toContain('salamander-password')
})

test('TUIC v5 ALPN, hopping and UDP', () => {
  expect(
    getSurfboardNodes([
      {
        ...tuic,
        version: '5',
        alpn: ['custom'],
        portHopping: '443;8443',
        portHoppingInterval: 15,
        udpRelay: false,
      },
    ]),
  ).toContain(
    'alpn=custom, port-hopping="443;8443", port-hopping-interval=15, udp-relay=false',
  )
})

test('AnyTLS session reuse and UDP', () => {
  expect(
    getSurfboardNodes([{ ...anytls, reuse: false, udpRelay: false }]),
  ).toBe(
    'proxy = anytls, example.com, 443, password=secret, reuse=false, udp-relay=false',
  )
})

test.each([1, 2, 3, 4, 5])('Snell v%s obfs and UDP', (version) => {
  const options = createOptions()
  const output = getSurfboardNodes(
    [
      {
        ...snell,
        version,
        obfs: 'http',
        obfsHost: 'cdn.example.com',
        obfsUri: '/obfs',
        udpRelay: true,
      },
    ],
    undefined,
    options,
  )
  expect(output).toContain(
    `psk=secret, version=${Math.min(version, 4)}, obfs=http, obfs-host=cdn.example.com, obfs-uri=/obfs`,
  )
  expect(output.includes('udp-relay=true')).toBe(version >= 3)
  expect(options.logger.warn).toHaveBeenCalledTimes(version === 5 ? 1 : 0)
})

describe('WireGuard', () => {
  test('minimal proxy reference and standalone section', () => {
    expect(getSurfboardNodes([wg])).toBe('wg = wireguard, section-name=wg')
    expect(getSurfboardWireguardNodes([wg])).toBe(
      '[WireGuard wg]\nprivate-key=private=\nself-ip=10.0.0.2\npeer=(public-key=public=, allowed-ips=0.0.0.0/0, endpoint=example.com:51820)',
    )
    expect(getSurfboardNodeNames([wg])).toBe('wg')
  })

  test('IPv6, routes, DNS, pre-shared key, MTU, keepalive zero and block-quic', () => {
    const node: WireguardNodeConfig = {
      ...wg,
      nodeName: 'home tunnel',
      selfIpV6: 'fd00::2',
      dnsServers: ['1.1.1.1', '2606:4700:4700::1111'],
      mtu: 1420,
      blockQuic: 'on',
      peers: [
        {
          ...wg.peers[0],
          endpoint: '[2001:db8::1]:51820',
          allowedIps: '0.0.0.0/0, ::/0',
          presharedKey: 'shared=',
          keepalive: 0,
        },
      ],
    }
    expect(getSurfboardNodes([node])).toBe(
      'home tunnel = wireguard, section-name="home tunnel", block-quic=on',
    )
    expect(getSurfboardWireguardNodes([node])).toBe(
      '[WireGuard home tunnel]\nprivate-key=private=\nself-ip=10.0.0.2\nself-ip-v6=fd00::2\ndns-server=1.1.1.1, 2606:4700:4700::1111\nmtu=1420\npeer=(public-key=public=, allowed-ips="0.0.0.0/0, ::/0", endpoint=[2001:db8::1]:51820, preshared-key=shared=, keepalive=0)',
    )
    expect(getSurfboardNodeNames([node])).toBe('"home tunnel"')
  })
})

const unsupported: PossibleNodeConfigType[] = [
  { ...ss, method: 'aes-128-cfb' },
  { ...ss, method: '2022-blake3-chacha20-poly1305' },
  ...(['ws', 'wss', 'quic'] as const).map((obfs) => ({ ...ss, obfs })),
  { ...ss, shadowTls: { password: 'secret', sni: 'example.com' } },
  { ...vmess, network: 'grpc' },
  { ...vmess, method: 'none' },
  {
    ...base,
    type: NodeTypeEnum.Vless,
    uuid: vmess.uuid,
    network: 'tcp',
    method: 'none',
  },
  { ...base, type: NodeTypeEnum.Socks5, tls: true, clientCert: 'client' },
  { ...anytls, realityOpts: { publicKey: 'public' } },
  { ...base, type: NodeTypeEnum.Tuic, token: 'token' },
  { ...tuic, version: 6 },
  { ...tuic, alpn: ['h3', 'custom'] },
  { ...snell, version: 6 },
  { ...trojan, password: 'both\'"quotes' },
  { ...trojan, password: 'new\nline' },
  { ...wg, underlyingProxy: 'upstream' },
  { ...wg, peers: [wg.peers[0], wg.peers[0]] },
  { ...wg, peers: [{ ...wg.peers[0], allowedIps: undefined }] },
  { ...wg, peers: [{ ...wg.peers[0], endpoint: '2001:db8::1:51820' }] },
  { ...wg, reservedBits: [0, 0, 0] },
  { ...wg, peers: [{ ...wg.peers[0], reservedBits: [0, 0, 0] }] },
]

test.each(unsupported.map((node, i) => [i, node] as const))(
  'unsupported input %s is omitted consistently and warns through injected logger',
  (_, node) => {
    for (const formatter of [
      getSurfboardNodes,
      getSurfboardNodeNames,
      getSurfboardWireguardNodes,
    ]) {
      const options = createOptions()
      expect(formatter([node], undefined, options)).toBe('')
      expect(options.logger.warn).toHaveBeenCalledOnce()
      expect(options.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(`${node.nodeName} 会被省略`),
      )
    }
  },
)

test('disabled nodes, filters and sorting are shared by all outputs', () => {
  const nodes = [
    { ...wg, nodeName: 'a' },
    { ...wg, nodeName: 'b' },
    { ...wg, nodeName: 'disabled', enable: false },
    { ...ss, nodeName: 'ss' },
  ]
  const filter = (node: PossibleNodeConfigType) => node.nodeName === 'b'
  expect(getSurfboardNodes(nodes, filter)).toBe('b = wireguard, section-name=b')
  expect(getSurfboardNodeNames(nodes, filter)).toBe('b')
  expect(getSurfboardWireguardNodes(nodes, filter)).toContain('[WireGuard b]')
  const sorted = mergeSortedFilters([
    filter,
    (node: PossibleNodeConfigType) => node.nodeName === 'a',
  ])
  expect(getSurfboardNodeNames(nodes, sorted)).toBe('b, a')
  expect(
    getSurfboardNodes(nodes, sorted)
      .split('\n')
      .map((line) => line.split(' = ')[0]),
  ).toEqual(['b', 'a'])
  expect(
    getSurfboardWireguardNodes(nodes, sorted).match(/\[WireGuard .\]/g),
  ).toEqual(['[WireGuard b]', '[WireGuard a]'])
})

test('new optional fields survive node/config validation', () => {
  expect(
    SnellNodeConfigValidator.parse({
      ...snell,
      obfsUri: '/obfs',
      udpRelay: false,
    }),
  ).toMatchObject({ obfsUri: '/obfs', udpRelay: false })
  expect(
    TuicNodeConfigValidator.parse({ ...tuic, udpRelay: false }),
  ).toHaveProperty('udpRelay', false)
  expect(
    AnyTLSNodeConfigValidator.parse({
      ...anytls,
      surfboardConfig: { geckoPassword: 'gecko' },
    }),
  ).toHaveProperty('surfboardConfig.geckoPassword', 'gecko')
  expect(
    SurfboardConfigValidator.safeParse({ geckoPassword: '' }).success,
  ).toBe(false)
})

test('getSurfboardNodes reminds the template to emit WireGuard sections', () => {
  const options = createOptions()

  expect(getSurfboardNodes([wg, ss], undefined, options)).toContain(
    'wg = wireguard, section-name=wg',
  )
  expect(options.logger.info).toHaveBeenCalledOnce()
  expect(options.logger.info).toHaveBeenCalledWith(
    '请配合使用 getSurfboardWireguardNodes 生成 wg 节点配置',
  )

  const quiet = createOptions()
  getSurfboardWireguardNodes([wg], undefined, quiet)
  getSurfboardNodeNames([wg], undefined, quiet)
  expect(quiet.logger.info).not.toHaveBeenCalled()
})
