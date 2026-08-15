import { beforeEach, expect, test, vi } from 'vitest'

import { NodeTypeEnum, SupportProviderEnum } from '../../types.js'
import * as config from '../../config.js'
import CustomProvider from '../CustomProvider.js'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('CustomProvider should work', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
  })

  expect(await provider.getNodeList()).toEqual([])
})

test('CustomProvider normalizes mihomo Clash core alias', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Shadowsocks,
        nodeName: 'mihomo-node',
        hostname: 'example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        clashConfig: { clashCore: 'mihomo' },
      },
    ],
  })

  expect(await provider.getNodeList()).toEqual([
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'mihomo-node',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      clashConfig: { clashCore: 'clash.meta' },
    },
  ])
})

test('CustomProvider supports masque nodes', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Masque,
        authMode: 'basic-auth',
        nodeName: 'masque-test',
        hostname: 'masque.example.com',
        port: 443,
        username: 'user',
        password: 'pass',
        alpn: ['h3'],
      },
    ],
  })

  expect(await provider.getNodeList()).toEqual([
    {
      type: 'masque',
      authMode: 'basic-auth',
      nodeName: 'masque-test',
      hostname: 'masque.example.com',
      port: 443,
      username: 'user',
      password: 'pass',
      alpn: ['h3'],
    },
  ])
})

test('CustomProvider supports masque key-pair nodes', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Masque,
        authMode: 'key-pair',
        nodeName: 'warp-masque',
        hostname: 'masque.example.com',
        port: 443,
        privateKey: 'private-key',
        publicKey: 'public-key',
        ip: '172.16.0.2/32',
        network: 'h3',
      },
    ],
  })

  expect(await provider.getNodeList()).toEqual([
    {
      type: 'masque',
      authMode: 'key-pair',
      nodeName: 'warp-masque',
      hostname: 'masque.example.com',
      port: 443,
      privateKey: 'private-key',
      publicKey: 'public-key',
      ip: '172.16.0.2/32',
      network: 'h3',
    },
  ])
})

test('CustomProvider rejects provider underlyingProxy with MASQUE portHopping', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    underlyingProxy: 'upstream',
    nodeList: [
      {
        type: NodeTypeEnum.Masque,
        authMode: 'basic-auth',
        nodeName: 'masque-test',
        hostname: 'masque.example.com',
        port: 443,
        portHopping: '1234;5000-6000',
      },
    ],
  })

  await expect(provider.getNodeList()).rejects.toThrow('节点配置校验失败')
})

test('CustomProvider supports TrustTunnel nodes', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.TrustTunnel,
        nodeName: 'trust-tunnel',
        hostname: 'trust.example.com',
        port: 443,
        username: 'user',
        password: 'pass',
        alpn: ['h2'],
        maxStreams: 3,
      },
    ],
  })

  expect(await provider.getNodeList()).toEqual([
    {
      type: 'trust-tunnel',
      nodeName: 'trust-tunnel',
      hostname: 'trust.example.com',
      port: 443,
      username: 'user',
      password: 'pass',
      alpn: ['h2'],
      maxStreams: 3,
    },
  ])
})

test('CustomProvider underlying proxy', async () => {
  expect(
    await new CustomProvider('test', {
      type: SupportProviderEnum.Custom,
      underlyingProxy: 'underlying-proxy',
      nodeList: [
        {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: 'test',
          hostname: 'example.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'password',
          udpRelay: true,
        },
      ],
    }).getNodeList(),
  ).toEqual([
    {
      nodeName: 'test',
      type: 'shadowsocks',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      udpRelay: true,
      underlyingProxy: 'underlying-proxy',
    },
  ])

  expect(
    await new CustomProvider('test', {
      type: SupportProviderEnum.Custom,
      underlyingProxy: 'underlying-proxy-1',
      nodeList: [
        {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: 'test',
          hostname: 'example.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'password',
          udpRelay: true,
          underlyingProxy: 'underlying-proxy-2',
        },
      ],
    }).getNodeList(),
  ).toEqual([
    {
      nodeName: 'test',
      type: 'shadowsocks',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      udpRelay: true,
      underlyingProxy: 'underlying-proxy-2',
    },
  ])

  expect(
    await new CustomProvider('test', {
      type: SupportProviderEnum.Custom,
      underlyingProxy: 'underlying-proxy-2',
      nodeList: [
        {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: 'test',
          udpRelay: true,
          hostname: 'example.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'password',
          underlyingProxy: 'underlying-proxy-2',
        },
      ],
    }).getNodeList(),
  ).toEqual([
    {
      nodeName: 'test',
      type: 'shadowsocks',
      udpRelay: true,
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      underlyingProxy: 'underlying-proxy-2',
    },
  ])
})

test('CustomProvider with hooks', async () => {
  const nodeList = [
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    } as const,
  ]
  const afterNodeListResponse = vi.fn((nodeList) => {
    // @ts-ignore
    nodeList[0].hostname = 'example.org'
  })
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList,
    hooks: {
      afterNodeListResponse,
    },
  })

  expect(await provider.getNodeList()).toEqual([
    {
      ...nodeList[0],
      hostname: 'example.org',
    },
  ])
  expect(afterNodeListResponse).toHaveBeenCalledOnce()
})

test('CustomProvider nodeList function receives params', async () => {
  const nodeListFn = vi.fn().mockResolvedValue([
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
  ])
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: nodeListFn,
  })

  const params = { requestId: 'req-1' }
  await provider.getNodeList(params)

  expect(nodeListFn).toHaveBeenCalledExactlyOnceWith(params)
})

test('CustomProvider returns list from hook when provided', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Shadowsocks,
        nodeName: 'test',
        hostname: 'example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
      },
    ],
    hooks: {
      afterNodeListResponse: () =>
        [
          {
            type: NodeTypeEnum.Shadowsocks,
            nodeName: 'override',
            hostname: 'override.example.com',
            port: 443,
            method: 'chacha20-ietf-poly1305',
            password: 'password',
          },
        ] as any,
    },
  })

  expect(await provider.getNodeList()).toEqual([
    {
      type: 'shadowsocks',
      nodeName: 'override',
      hostname: 'override.example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
  ])
})

test('CustomProvider throws for unknown node type', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: 'unknown' as NodeTypeEnum,
        nodeName: 'test',
      },
    ] as any,
  })

  await expect(provider.getNodeList()).rejects.toThrow('节点配置校验失败')
})

test('CustomProvider applies vmess compatibility rules', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Vmess,
        nodeName: 'vmess-test',
        hostname: 'example.com',
        port: 443,
        method: 'auto',
        uuid: '2e1a3b2a-0a6e-4aa6-9b1f-32b3f4cc0c1a',
        network: 'tcp',
        host: 'sni.example.com',
        wsHeaders: {
          Host: 'ws.example.com',
        },
      },
    ],
  })

  expect(await provider.getNodeList()).toEqual([
    {
      type: 'vmess',
      nodeName: 'vmess-test',
      hostname: 'example.com',
      port: 443,
      method: 'auto',
      uuid: '2e1a3b2a-0a6e-4aa6-9b1f-32b3f4cc0c1a',
      host: 'sni.example.com',
      wsHeaders: {
        Host: 'ws.example.com',
      },
      sni: 'sni.example.com',
      wsOpts: {
        headers: {
          Host: 'ws.example.com',
        },
        path: '/',
      },
      network: 'tcp',
    },
  ])
})

test('CustomProvider accepts and validates Tailscale nodes', async () => {
  const validProvider = new CustomProvider('tailscale-provider', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Tailscale,
        nodeName: 'tailnet',
        hostname: 'surgio-node',
        ephemeral: false,
        routingMark: 0,
      },
    ],
  })

  expect(await validProvider.getNodeList()).toEqual([
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'tailnet',
      hostname: 'surgio-node',
      ephemeral: false,
      routingMark: 0,
    },
  ])

  const invalidProvider = new CustomProvider('tailscale-provider', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Tailscale,
        nodeName: 'invalid-tailnet',
        mtu: 1421,
      } as any,
    ],
  })
  const error = await invalidProvider.getNodeList().catch((caught) => caught)

  expect(error).toBeInstanceOf(Error)
  expect(error.message).toContain('节点配置校验失败')
  expect(error.providerName).toBe('tailscale-provider')
  expect(error.nodeIndex).toBe(0)
})

test('CustomProvider rejects conflicting vmess ws headers', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Vmess,
        nodeName: 'vmess-test',
        hostname: 'example.com',
        port: 443,
        method: 'auto',
        uuid: '2e1a3b2a-0a6e-4aa6-9b1f-32b3f4cc0c1a',
        network: 'tcp',
        wsHeaders: {
          Host: 'ws.example.com',
        },
        wsOpts: {
          headers: {
            Host: 'override.example.com',
          },
          path: '/ws',
        },
      },
    ],
  })

  await expect(provider.getNodeList()).rejects.toThrow('节点配置校验失败')
})

test('CustomProvider rejects vmess path on ws network', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Vmess,
        nodeName: 'vmess-test',
        hostname: 'example.com',
        port: 443,
        method: 'auto',
        uuid: '2e1a3b2a-0a6e-4aa6-9b1f-32b3f4cc0c1a',
        network: 'ws',
        path: '/legacy',
        wsOpts: {
          path: '/ws',
        },
      },
    ],
  })

  await expect(provider.getNodeList()).rejects.toThrow('节点配置校验失败')
})

test('CustomProvider rejects vless path on xhttp network', async () => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Vless,
        nodeName: 'vless-test',
        hostname: 'example.com',
        port: 443,
        method: 'none',
        uuid: '2e1a3b2a-0a6e-4aa6-9b1f-32b3f4cc0c1a',
        network: 'xhttp',
        path: '/legacy',
        encryption: 'none',
        tls: true,
        xhttpOpts: {
          path: '/xhttp',
        },
      } as any,
    ],
  })

  await expect(provider.getNodeList()).rejects.toThrow('节点配置校验失败')
})
