import { describe, expect, test, vi } from 'vitest'

import { ERR_INVALID_FILTER } from '../../constant/index.js'
import { NodeTypeEnum, PossibleNodeConfigType } from '../../types.js'
import { getEgernNodeNames, getEgernNodes } from '../egern.js'

const formatWithWarn = (list: ReadonlyArray<PossibleNodeConfigType>) => {
  const warn = vi.fn()
  const nodes = getEgernNodes(list, undefined, { logger: { warn } as any })
  return { nodes, warn }
}

const vmessBase = {
  type: NodeTypeEnum.Vmess,
  hostname: 'vmess.example.com',
  port: 443,
  method: 'auto',
  uuid: '00000000-0000-0000-0000-000000000000',
} as const

const vlessBase = {
  type: NodeTypeEnum.Vless,
  hostname: 'vless.example.com',
  port: 443,
  method: 'none',
  uuid: '11111111-1111-1111-1111-111111111111',
} as const

describe('getEgernNodes', () => {
  test('formats Shadowsocks with obfs and common fields', () => {
    expect(
      getEgernNodes([
        {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: 'ss',
          hostname: 'ss.example.com',
          port: 8388,
          method: 'aes-256-gcm',
          password: 'password',
          obfs: 'http',
          obfsHost: 'www.bing.com',
          obfsUri: '/path',
          tfo: true,
          udpRelay: true,
          underlyingProxy: 'front',
          blockQuic: 'on',
          ipVersion: 'prefer-v4',
          shadowTls: { password: 'stls', sni: 'www.microsoft.com' },
        },
      ]),
    ).toEqual([
      {
        shadowsocks: {
          name: 'ss',
          server: 'ss.example.com',
          port: 8388,
          method: 'aes-256-gcm',
          password: 'password',
          obfs: 'http',
          obfs_host: 'www.bing.com',
          obfs_uri: '/path',
          tfo: true,
          udp_relay: true,
          block_quic: true,
          prev_hop: 'front',
          ip_version: 'v4_prefer',
          shadow_tls: { password: 'stls', sni: 'www.microsoft.com' },
        },
      },
    ])
  })

  test('skips Shadowsocks with v2ray-plugin obfs', () => {
    const { nodes, warn } = formatWithWarn([
      {
        type: NodeTypeEnum.Shadowsocks,
        nodeName: 'ss-ws',
        hostname: 'ss.example.com',
        port: 443,
        method: 'aes-256-gcm',
        password: 'password',
        obfs: 'wss',
      },
    ])

    expect(nodes).toEqual([])
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 Shadowsocks 的 wss 混淆，节点 ss-ws 会被忽略',
    )
  })

  test('formats Snell up to v5 and skips v6', () => {
    const { nodes, warn } = formatWithWarn([
      {
        type: NodeTypeEnum.Snell,
        nodeName: 'snell-v4',
        hostname: 'snell.example.com',
        port: 8388,
        psk: 'psk',
        version: 4,
        reuse: true,
        udpRelay: true,
        obfs: 'tls',
        obfsHost: 'example.com',
      },
      {
        type: NodeTypeEnum.Snell,
        nodeName: 'snell-v6',
        hostname: 'snell.example.com',
        port: 8388,
        psk: 'psk',
        version: 6,
      },
    ])

    expect(nodes).toEqual([
      {
        snell: {
          name: 'snell-v4',
          server: 'snell.example.com',
          port: 8388,
          psk: 'psk',
          version: 4,
          reuse: true,
          obfs: 'tls',
          obfs_host: 'example.com',
          udp_relay: true,
        },
      },
    ])
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 Snell v6，节点 snell-v6 会被忽略',
    )
  })

  test('formats Trojan with WebSocket', () => {
    expect(
      getEgernNodes([
        {
          type: NodeTypeEnum.Trojan,
          nodeName: 'trojan',
          hostname: 'trojan.example.com',
          port: 443,
          password: 'password',
          sni: 'sni.example.com',
          skipCertVerify: true,
          serverCertFingerprintSha256: 'aa:bb',
          network: 'ws',
          wsPath: '/ws',
          wsHeaders: { host: 'host.example.com' },
        },
      ]),
    ).toEqual([
      {
        trojan: {
          name: 'trojan',
          server: 'trojan.example.com',
          port: 443,
          password: 'password',
          sni: 'sni.example.com',
          skip_tls_verify: true,
          fingerprint_sha256: 'aa:bb',
          websocket: { path: '/ws', host: 'host.example.com' },
        },
      },
    ])
  })

  test('verifies AnyTLS certificates unless skipCertVerify is set', () => {
    expect(
      getEgernNodes([
        {
          type: NodeTypeEnum.AnyTLS,
          nodeName: 'anytls',
          hostname: 'anytls.example.com',
          port: 443,
          password: 'password',
          realityOpts: { publicKey: 'public-key', shortId: 'abc123' },
        },
      ]),
    ).toEqual([
      {
        anytls: {
          name: 'anytls',
          server: 'anytls.example.com',
          port: 443,
          password: 'password',
          skip_tls_verify: false,
          reality: { public_key: 'public-key', short_id: 'abc123' },
        },
      },
    ])
  })

  test('formats Hysteria2 with comma-separated port hopping', () => {
    expect(
      getEgernNodes([
        {
          type: NodeTypeEnum.Hysteria2,
          nodeName: 'hy2',
          hostname: 'hy2.example.com',
          port: 443,
          password: 'auth',
          sni: 'hy2.example.com',
          obfs: 'salamander',
          obfsPassword: 'obfs',
          uploadBandwidth: 100,
          downloadBandwidth: 200,
          portHopping: '443;5000-6000',
          portHoppingInterval: 30,
          udpRelay: true,
          tfo: true,
        },
      ]),
    ).toEqual([
      {
        hysteria2: {
          name: 'hy2',
          server: 'hy2.example.com',
          port: 443,
          auth: 'auth',
          sni: 'hy2.example.com',
          obfs: 'salamander',
          obfs_password: 'obfs',
          port_hopping: '443,5000-6000',
          port_hopping_interval: 30,
          bandwidth: 100,
        },
      },
    ])
  })

  test('formats TUIC v5 and skips TUIC v4', () => {
    const { nodes, warn } = formatWithWarn([
      {
        type: NodeTypeEnum.Tuic,
        nodeName: 'tuic',
        hostname: 'tuic.example.com',
        port: 443,
        uuid: '22222222-2222-2222-2222-222222222222',
        password: 'password',
        version: 5,
        alpn: ['h3'],
        sni: 'tuic.example.com',
      },
      {
        type: NodeTypeEnum.Tuic,
        nodeName: 'tuic-v4',
        hostname: 'tuic.example.com',
        port: 443,
        token: 'token',
      },
    ])

    expect(nodes).toEqual([
      {
        tuic: {
          name: 'tuic',
          server: 'tuic.example.com',
          port: 443,
          uuid: '22222222-2222-2222-2222-222222222222',
          password: 'password',
          alpn: ['h3'],
          sni: 'tuic.example.com',
        },
      },
    ])
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 TUIC v4，节点 tuic-v4 会被忽略',
    )
  })

  test('formats SOCKS5, SOCKS5 over TLS, HTTP and HTTPS', () => {
    expect(
      getEgernNodes([
        {
          type: NodeTypeEnum.Socks5,
          nodeName: 'socks5',
          hostname: 'socks.example.com',
          port: 1080,
          username: 'user',
          password: 'pass',
          udpRelay: true,
        },
        {
          type: NodeTypeEnum.Socks5,
          nodeName: 'socks5-tls',
          hostname: 'socks.example.com',
          port: 443,
          tls: true,
          sni: 'socks.example.com',
        },
        {
          type: NodeTypeEnum.HTTP,
          nodeName: 'http',
          hostname: 'http.example.com',
          port: 8080,
          username: 'user',
          password: 'pass',
          headers: { 'User-Agent': 'curl' },
          blockQuic: 'on',
        },
        {
          type: NodeTypeEnum.HTTPS,
          nodeName: 'https',
          hostname: 'https.example.com',
          port: 443,
          skipCertVerify: true,
        },
      ]),
    ).toEqual([
      {
        socks5: {
          name: 'socks5',
          server: 'socks.example.com',
          port: 1080,
          username: 'user',
          password: 'pass',
          udp_relay: true,
        },
      },
      {
        socks5_tls: {
          name: 'socks5-tls',
          server: 'socks.example.com',
          port: 443,
          sni: 'socks.example.com',
        },
      },
      {
        http: {
          name: 'http',
          server: 'http.example.com',
          port: 8080,
          username: 'user',
          password: 'pass',
          headers: { 'User-Agent': 'curl' },
        },
      },
      {
        https: {
          name: 'https',
          server: 'https.example.com',
          port: 443,
          skip_tls_verify: true,
        },
      },
    ])
  })

  test('formats Vmess transports', () => {
    const nodes = getEgernNodes([
      { ...vmessBase, nodeName: 'tcp', network: 'tcp', alterId: '64' },
      { ...vmessBase, nodeName: 'tcp-tls', network: 'tcp', tls: true },
      {
        ...vmessBase,
        nodeName: 'ws',
        network: 'ws',
        wsOpts: { path: '/ws', headers: { Host: 'host.example.com' } },
      },
      {
        ...vmessBase,
        nodeName: 'wss',
        network: 'ws',
        tls: true,
        sni: 'sni.example.com',
        wsOpts: { path: '/ws' },
      },
      {
        ...vmessBase,
        nodeName: 'http',
        network: 'http',
        httpOpts: { method: 'GET', path: ['/a', '/b'] },
      },
      {
        ...vmessBase,
        nodeName: 'h2',
        network: 'h2',
        tls: true,
        h2Opts: { path: '/h2', host: ['h2.example.com'] },
      },
      {
        ...vmessBase,
        nodeName: 'grpc',
        network: 'grpc',
        tls: true,
        grpcOpts: { serviceName: 'GunService' },
      },
    ])

    expect(nodes.map((node) => node.vmess.transport)).toEqual([
      undefined,
      { tls: {} },
      { ws: { path: '/ws', headers: { Host: 'host.example.com' } } },
      { wss: { path: '/ws', sni: 'sni.example.com' } },
      { http1: { method: 'GET', path: '/a' } },
      { http2: { path: '/h2', headers: { Host: 'h2.example.com' } } },
      { grpc: { service_name: 'GunService' } },
    ])
    expect(nodes[0]).toEqual({
      vmess: {
        name: 'tcp',
        server: 'vmess.example.com',
        port: 443,
        user_id: '00000000-0000-0000-0000-000000000000',
        security: 'auto',
        legacy: true,
      },
    })
    expect(nodes[1].vmess).not.toHaveProperty('legacy')
  })

  test('skips Vmess transports Egern cannot express', () => {
    const { nodes, warn } = formatWithWarn([
      {
        ...vmessBase,
        nodeName: 'http-tls',
        network: 'http',
        tls: true,
        httpOpts: { method: 'GET', path: ['/'] },
      },
      { ...vmessBase, nodeName: 'quic', network: 'quic' },
    ])

    expect(nodes).toEqual([])
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 HTTP 传输的 TLS，节点 http-tls 会被忽略',
    )
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 quic 传输，节点 quic 会被忽略',
    )
  })

  test('formats Vless with TLS and Reality', () => {
    const nodes = getEgernNodes([
      {
        ...vlessBase,
        nodeName: 'reality',
        network: 'tcp',
        flow: 'xtls-rprx-vision',
        sni: 'www.microsoft.com',
        realityOpts: { publicKey: 'public-key', shortId: 'abc123' },
      },
      {
        ...vlessBase,
        nodeName: 'grpc-reality',
        network: 'grpc',
        grpcOpts: { serviceName: 'grpc' },
        realityOpts: { publicKey: 'public-key' },
      },
      {
        ...vlessBase,
        nodeName: 'wss',
        network: 'ws',
        wsOpts: { path: '/ws' },
      },
    ])

    expect(nodes).toEqual([
      {
        vless: {
          name: 'reality',
          server: 'vless.example.com',
          port: 443,
          user_id: '11111111-1111-1111-1111-111111111111',
          flow: 'xtls-rprx-vision',
          transport: {
            tls: {
              sni: 'www.microsoft.com',
              reality: { public_key: 'public-key', short_id: 'abc123' },
            },
          },
        },
      },
      {
        vless: {
          name: 'grpc-reality',
          server: 'vless.example.com',
          port: 443,
          user_id: '11111111-1111-1111-1111-111111111111',
          transport: {
            grpc: {
              service_name: 'grpc',
              reality: { public_key: 'public-key' },
            },
          },
        },
      },
      {
        vless: {
          name: 'wss',
          server: 'vless.example.com',
          port: 443,
          user_id: '11111111-1111-1111-1111-111111111111',
          transport: { wss: { path: '/ws' } },
        },
      },
    ])
  })

  test('skips Vless features Egern does not support', () => {
    const { nodes, warn } = formatWithWarn([
      {
        ...vlessBase,
        nodeName: 'ws-reality',
        network: 'ws',
        wsOpts: { path: '/ws' },
        realityOpts: { publicKey: 'public-key' },
      },
      {
        ...vlessBase,
        nodeName: 'encrypted',
        network: 'tcp',
        encryption: 'mlkem768x25519plus',
      },
      {
        ...vlessBase,
        nodeName: 'xhttp',
        network: 'xhttp',
      },
    ])

    expect(nodes).toEqual([])
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 ws 传输上的 Reality，节点 ws-reality 会被忽略',
    )
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 VLESS encryption=mlkem768x25519plus，节点 encrypted 会被忽略',
    )
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 xhttp 传输，节点 xhttp 会被忽略',
    )
  })

  test('formats WireGuard with a single peer', () => {
    const { nodes, warn } = formatWithWarn([
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'wireguard',
        selfIp: '172.16.0.2',
        selfIpV6: 'fd01:5ca1:ab1e::2',
        privateKey: 'private-key',
        mtu: 1280,
        dnsServers: ['1.1.1.1'],
        reservedBits: [4, 5, 6],
        peers: [
          {
            endpoint: '[2606:4700:d0::a29f:c001]:2408',
            publicKey: 'public-key',
            presharedKey: 'preshared-key',
            keepalive: 25,
          },
        ],
      },
      {
        type: NodeTypeEnum.Wireguard,
        nodeName: 'multi-peer',
        selfIp: '172.16.0.2',
        privateKey: 'private-key',
        peers: [
          { endpoint: 'a.example.com:51820', publicKey: 'a' },
          { endpoint: 'b.example.com:51820', publicKey: 'b' },
        ],
      },
    ])

    expect(nodes).toEqual([
      {
        wireguard: {
          name: 'wireguard',
          server: '2606:4700:d0::a29f:c001',
          port: 2408,
          private_key: 'private-key',
          peer_public_key: 'public-key',
          preshared_key: 'preshared-key',
          reserved: [4, 5, 6],
          local_ipv4: '172.16.0.2/32',
          local_ipv6: 'fd01:5ca1:ab1e::2/128',
          dns_servers: ['1.1.1.1'],
          mtu: 1280,
          keepalive: 25,
        },
      },
    ])
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 WireGuard 多 Peer，节点 multi-peer 会被忽略',
    )
  })

  test('omits unknown ipVersion values and maps Mihomo values', () => {
    const { nodes, warn } = formatWithWarn([
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'unknown',
        hostname: 'socks.example.com',
        port: 1080,
        ipVersion: 'constructor',
      },
      {
        type: NodeTypeEnum.Socks5,
        nodeName: 'mihomo',
        hostname: 'socks.example.com',
        port: 1080,
        ipVersion: 'ipv6',
        blockQuic: 'auto',
      },
    ])

    expect(nodes[0].socks5).not.toHaveProperty('ip_version')
    expect(nodes[1].socks5).toEqual({
      name: 'mihomo',
      server: 'socks.example.com',
      port: 1080,
      ip_version: 'v6_only',
    })
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 ipVersion=constructor，节点 unknown 将不包含此字段',
    )
  })

  test('skips ShadowTLS on protocols without ShadowTLS support', () => {
    const { nodes, warn } = formatWithWarn([
      {
        type: NodeTypeEnum.Snell,
        nodeName: 'snell-stls',
        hostname: 'snell.example.com',
        port: 443,
        psk: 'psk',
        version: 4,
        shadowTls: { password: 'stls', sni: 'www.microsoft.com' },
      },
    ])

    expect(nodes).toEqual([])
    expect(warn).toHaveBeenCalledWith(
      'Egern 不支持 snell 节点的 ShadowTLS，节点 snell-stls 会被忽略',
    )
  })

  test('skips unsupported and disabled nodes', () => {
    const { nodes, warn } = formatWithWarn([
      {
        type: NodeTypeEnum.Shadowsocksr,
        nodeName: 'ssr',
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
        hostname: 'ss.example.com',
        port: 443,
        method: 'aes-256-gcm',
        password: 'password',
      },
    ])

    expect(nodes).toEqual([])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      '不支持为 Egern 生成 shadowsocksr 的节点，节点 ssr 会被忽略',
    )
  })
})

describe('getEgernNodeNames', () => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'ss',
      hostname: 'ss.example.com',
      port: 8388,
      method: 'aes-256-gcm',
      password: 'password',
    },
    {
      type: NodeTypeEnum.Wireguard,
      nodeName: 'wireguard',
      selfIp: '172.16.0.2',
      privateKey: 'private-key',
      peers: [{ endpoint: 'wg.example.com:51820', publicKey: 'public-key' }],
    },
    {
      type: NodeTypeEnum.Tuic,
      nodeName: 'tuic-v4',
      hostname: 'tuic.example.com',
      port: 443,
      token: 'token',
    },
  ]

  test('returns names of formatted nodes', () => {
    const warn = vi.fn()

    expect(
      getEgernNodeNames(nodeList, undefined, { logger: { warn } as any }),
    ).toEqual(['ss', 'wireguard'])
    expect(
      getEgernNodeNames(nodeList, (node) => node.nodeName === 'ss'),
    ).toEqual(['ss'])
  })

  test('rejects an explicitly undefined filter', () => {
    expect(() => getEgernNodeNames(nodeList, undefined)).toThrow(
      ERR_INVALID_FILTER,
    )
  })
})
