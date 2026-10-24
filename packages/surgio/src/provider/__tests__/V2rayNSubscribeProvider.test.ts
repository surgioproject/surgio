import { beforeEach, expect, test, vi } from 'vitest'

import { NodeTypeEnum, SupportProviderEnum } from '../../types.js'
import * as config from '../../config.js'
import { toBase64, toUrlSafeBase64 } from '../../utils/portable.js'
import Provider from '../Provider.js'
import V2rayNSubscribeProvider, {
  getV2rayNSubscription,
  parseJSONConfig,
  parseV2rayNSubscription,
} from '../V2rayNSubscribeProvider.js'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('V2rayNSubscribeProvider', async () => {
  const provider = new V2rayNSubscribeProvider('test', {
    type: SupportProviderEnum.V2rayNSubscribe,
    url: 'http://example.com/test-v2rayn-sub.txt',
  })

  await provider.getNodeList()
})

test('V2rayNSubscribeProvider preserves its request and metadata contract', async () => {
  const request = vi
    .spyOn(Provider, 'requestCacheableResource')
    .mockResolvedValue({
      body: toBase64(
        `ss://${toUrlSafeBase64('aes-128-gcm:password')}@ss.example.com:8388#SS`,
      ),
      subscriptionUserInfo: {
        upload: 1,
        download: 2,
        total: 3,
        expire: 4,
      },
    })
  const provider = new V2rayNSubscribeProvider('test', {
    type: SupportProviderEnum.V2rayNSubscribe,
    url: 'https://example.com/subscription',
  })

  const result = await provider.getNodeListV2()

  expect(provider.supportGetSubscriptionUserInfo).toBe(false)
  expect(request.mock.calls[0][1]['user-agent']).not.toContain('v2rayN')
  expect(result).not.toHaveProperty('subscriptionUserInfo')
})

test('getV2rayNSubscription', async () => {
  const url = 'http://example.com/test-v2rayn-sub.txt'
  const configList = await getV2rayNSubscription({
    url,
    isCompatibleMode: false,
    requestHeaders: { 'user-agent': 'v2rayN' },
    cacheKey: 'test-cache-key',
  })

  expect(configList).toMatchSnapshot()
})

test('getV2rayNSubscription compatible mode', async () => {
  const url = 'http://example.com/test-v2rayn-sub-compatible.txt'
  const configList = await getV2rayNSubscription({
    url,
    isCompatibleMode: true,
    requestHeaders: { 'user-agent': 'v2rayN' },
    cacheKey: 'test-cache-key',
  })

  expect(configList).toMatchSnapshot()
})

test('getV2rayNSubscription udpRelay skipCertVerify', async () => {
  const url = 'http://example.com/test-v2rayn-sub-compatible.txt'
  const configList = await getV2rayNSubscription({
    url,
    skipCertVerify: true,
    tls13: true,
    udpRelay: true,
    isCompatibleMode: true,
    requestHeaders: { 'user-agent': 'v2rayN' },
    cacheKey: 'test-cache-key',
  })

  expect(configList).toMatchSnapshot()
})

test('parseJSONConfig keeps its positional compatibility API', () => {
  expect(
    parseJSONConfig(
      JSON.stringify({
        v: '2',
        ps: 'VMess legacy API',
        add: 'vmess.example.com',
        port: 443,
        id: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        aid: 0,
        scy: 'auto',
        net: 'tcp',
        type: 'none',
        tls: 'tls',
      }),
      false,
      true,
      true,
      true,
    ),
  ).toMatchObject({
    type: NodeTypeEnum.Vmess,
    nodeName: 'VMess legacy API',
    skipCertVerify: true,
    udpRelay: true,
    tls13: true,
  })
})

test('parseV2rayNSubscription supports every protocol in the official subscription format', () => {
  const uuid = '1386f85e-657b-4d6e-9d56-78badb75e1fd'
  const vmess = `vmess://${toBase64(
    JSON.stringify({
      v: '2',
      ps: 'VMess',
      add: 'vmess.example.com',
      port: 443,
      id: uuid,
      aid: 0,
      scy: 'auto',
      net: 'ws',
      type: 'none',
      host: 'cdn.example.com',
      path: '/vmess',
      tls: 'tls',
      sni: 'vmess.example.com',
    }),
  )}`
  const links = [
    vmess,
    `ss://${toUrlSafeBase64('aes-128-gcm:password')}@ss.example.com:8388#SS`,
    `socks://${toUrlSafeBase64('user:password')}@socks.example.com:1080#SOCKS`,
    `vless://${uuid}@vless.example.com:443?encryption=none&security=reality&type=ws&host=cdn.example.com&path=%2Fvless&sni=vless.example.com&fp=chrome&pbk=public-key&sid=01234567#VLESS`,
    'trojan://password@trojan.example.com:443?security=tls&type=ws&host=cdn.example.com&path=%2Ftrojan&sni=trojan.example.com&allowInsecure=1#Trojan',
    'hysteria2://password@hy2.example.com:443?sni=hy2.example.com&insecure=1&obfs=salamander&obfs-password=obfs-password&mport=443-445#Hysteria2',
    `tuic://${uuid}:password@tuic.example.com:443?sni=tuic.example.com&alpn=h3&allow_insecure=1&congestion_control=bbr#TUIC`,
    `wireguard://${encodeURIComponent('private-key')}@wg.example.com:51820?publickey=${encodeURIComponent('public-key')}&presharedkey=${encodeURIComponent('preshared-key')}&address=${encodeURIComponent('10.0.0.2/32,fd00::2/128')}&reserved=1,2,3&mtu=1280#WireGuard`,
    'anytls://password@anytls.example.com:443?security=tls&sni=anytls.example.com&insecure=1#AnyTLS',
  ]

  const nodeList = parseV2rayNSubscription(toBase64(links.join('\n')))

  expect(nodeList.map((node) => node.type)).toEqual([
    NodeTypeEnum.Vmess,
    NodeTypeEnum.Shadowsocks,
    NodeTypeEnum.Socks5,
    NodeTypeEnum.Vless,
    NodeTypeEnum.Trojan,
    NodeTypeEnum.Hysteria2,
    NodeTypeEnum.Tuic,
    NodeTypeEnum.Wireguard,
    NodeTypeEnum.AnyTLS,
  ])
  expect(nodeList).toMatchObject([
    {
      nodeName: 'VMess',
      network: 'ws',
      wsOpts: { path: '/vmess', headers: { Host: 'cdn.example.com' } },
      tls: true,
    },
    { nodeName: 'SS', method: 'aes-128-gcm', password: 'password' },
    { nodeName: 'SOCKS', username: 'user', password: 'password' },
    {
      nodeName: 'VLESS',
      network: 'ws',
      realityOpts: { publicKey: 'public-key', shortId: '01234567' },
    },
    {
      nodeName: 'Trojan',
      network: 'ws',
      wsPath: '/trojan',
      skipCertVerify: true,
    },
    {
      nodeName: 'Hysteria2',
      obfs: 'salamander',
      obfsPassword: 'obfs-password',
      portHopping: '443-445',
    },
    {
      nodeName: 'TUIC',
      uuid,
      password: 'password',
      version: 5,
    },
    {
      nodeName: 'WireGuard',
      selfIp: '10.0.0.2',
      selfIpV6: 'fd00::2',
      privateKey: 'private-key',
      mtu: 1280,
      peers: [
        {
          publicKey: 'public-key',
          presharedKey: 'preshared-key',
          reservedBits: [1, 2, 3],
        },
      ],
    },
    {
      nodeName: 'AnyTLS',
      password: 'password',
      skipCertVerify: true,
    },
  ])
})

test('parseV2rayNSubscription supports plain text and standard VMess URLs', () => {
  const uuid = '1386f85e-657b-4d6e-9d56-78badb75e1fd'
  const nodeList = parseV2rayNSubscription(
    `vmess://${uuid}@vmess.example.com:443?security=tls&type=grpc&serviceName=example&authority=cdn.example.com&sni=vmess.example.com#VMess%20URL`,
  )

  expect(nodeList).toMatchObject([
    {
      type: NodeTypeEnum.Vmess,
      nodeName: 'VMess URL',
      uuid,
      network: 'grpc',
      grpcOpts: { serviceName: 'example' },
      tls: true,
    },
  ])
})

test('parseV2rayNSubscription omits an absent HTTP/2 host', () => {
  const uuid = '1386f85e-657b-4d6e-9d56-78badb75e1fd'
  const [node] = parseV2rayNSubscription(
    `vmess://${uuid}@vmess.example.com:443?security=tls&type=h2&path=%2Fh2#VMess%20H2`,
  )

  expect(node).toMatchObject({
    type: NodeTypeEnum.Vmess,
    network: 'h2',
    h2Opts: { path: '/h2' },
  })
  expect((node as any).h2Opts).not.toHaveProperty('host')
})

test('parseV2rayNSubscription preserves TUIC congestion control', () => {
  const uuid = '1386f85e-657b-4d6e-9d56-78badb75e1fd'

  expect(
    parseV2rayNSubscription(
      `tuic://${uuid}:password@tuic.example.com:443?congestion_control=bbr#TUIC`,
    ),
  ).toMatchObject([
    {
      type: NodeTypeEnum.Tuic,
      congestionControl: 'bbr',
    },
  ])
})

test('parseV2rayNSubscription rejects SOCKS4 instead of changing its protocol', () => {
  const logger = { warn: vi.fn(), debug: vi.fn() } as any

  expect(
    parseV2rayNSubscription(
      `socks4://${toUrlSafeBase64('user:password')}@socks.example.com:1080#SOCKS4`,
      { logger },
    ),
  ).toEqual([])
  expect(logger.warn).toHaveBeenCalledOnce()
})

test('parseV2rayNSubscription applies TLS options only to TLS SOCKS nodes', () => {
  const credentials = toUrlSafeBase64('user:password')
  const [tlsNode, plainNode] = parseV2rayNSubscription(
    [
      `socks://${credentials}@tls.example.com:1080?security=tls&sni=socks.example.com&allowInsecure=1#TLS`,
      `socks://${credentials}@plain.example.com:1080#Plain`,
    ].join('\n'),
    { skipCertVerify: true, tls13: true },
  )

  expect(tlsNode).toMatchObject({
    type: NodeTypeEnum.Socks5,
    tls: true,
    sni: 'socks.example.com',
    skipCertVerify: true,
    tls13: true,
  })
  expect(plainNode).toMatchObject({
    type: NodeTypeEnum.Socks5,
    tls: false,
  })
  expect(plainNode).not.toHaveProperty('skipCertVerify')
  expect(plainNode).not.toHaveProperty('tls13')
})

test('parseV2rayNSubscription supports internal node URLs', () => {
  const payload = toUrlSafeBase64(
    JSON.stringify({
      ConfigType: 10,
      ConfigVersion: 4,
      Remarks: 'HTTP internal',
      Address: 'proxy.example.com',
      Port: 8080,
      Username: 'user',
      Password: 'password',
    }),
  )

  expect(parseV2rayNSubscription(`v2rayn://http/${payload}`)).toMatchObject([
    {
      type: NodeTypeEnum.HTTP,
      nodeName: 'HTTP internal',
      hostname: 'proxy.example.com',
      port: 8080,
      username: 'user',
      password: 'password',
    },
  ])
})

test('parseV2rayNSubscription rejects unsupported internal config versions', () => {
  const logger = { warn: vi.fn(), debug: vi.fn() } as any
  const payload = toUrlSafeBase64(
    JSON.stringify({
      ConfigType: 10,
      ConfigVersion: 3,
      Remarks: 'old internal format',
      Address: 'proxy.example.com',
      Port: 8080,
    }),
  )

  expect(
    parseV2rayNSubscription(`v2rayn://http/${payload}`, { logger }),
  ).toEqual([])
  expect(logger.warn).toHaveBeenCalledOnce()
})

test('parseV2rayNSubscription uses the v2rayN WireGuard interface default', () => {
  const payload = toUrlSafeBase64(
    JSON.stringify({
      ConfigType: 9,
      ConfigVersion: 4,
      Remarks: 'WireGuard default address',
      Address: 'wg.example.com',
      Port: 51820,
      Password: 'private-key',
      ProtoExtraObj: {
        WgPublicKey: 'public-key',
      },
    }),
  )

  expect(
    parseV2rayNSubscription(`v2rayn://wireguard/${payload}`),
  ).toMatchObject([
    {
      type: NodeTypeEnum.Wireguard,
      selfIp: '172.16.0.2',
    },
  ])
})

test('parseV2rayNSubscription maps every supported internal profile type', () => {
  const uuid = '1386f85e-657b-4d6e-9d56-78badb75e1fd'
  const internal = (type: string, payload: Record<string, unknown>) =>
    `v2rayn://${type}/${toUrlSafeBase64(JSON.stringify(payload))}`
  const common = {
    ConfigVersion: 4,
    Address: 'proxy.example.com',
    Port: 443,
    Password: uuid,
    StreamSecurity: 'tls',
  }
  const nodeList = parseV2rayNSubscription(
    [
      internal('vmess', {
        ...common,
        ConfigType: 1,
        Remarks: 'VMess internal',
        Network: 'ws',
        ProtoExtraObj: { AlterId: 0, VmessSecurity: 'auto' },
        TransportExtraObj: { Host: 'cdn.example.com', Path: '/vmess' },
      }),
      internal('shadowsocks', {
        ...common,
        ConfigType: 3,
        Remarks: 'SS internal',
        Password: 'password',
        StreamSecurity: '',
        ProtoExtraObj: { SsMethod: 'aes-128-gcm' },
      }),
      internal('socks', {
        ...common,
        ConfigType: 4,
        Remarks: 'SOCKS internal',
        Username: 'user',
        Password: 'password',
        StreamSecurity: '',
      }),
      internal('vless', {
        ...common,
        ConfigType: 5,
        Remarks: 'VLESS internal',
        Network: 'grpc',
        StreamSecurity: 'reality',
        PublicKey: 'public-key',
        ShortId: '01234567',
        ProtoExtraObj: {
          VlessEncryption: 'none',
          Flow: 'xtls-rprx-vision',
        },
        TransportExtraObj: { GrpcServiceName: 'vless' },
      }),
      internal('trojan', {
        ...common,
        ConfigType: 6,
        Remarks: 'Trojan internal',
        Password: 'password',
        Network: 'ws',
        TransportExtraObj: { Host: 'cdn.example.com', Path: '/trojan' },
      }),
      internal('hysteria2', {
        ...common,
        ConfigType: 7,
        Remarks: 'Hysteria2 internal',
        Password: 'password',
        ProtoExtraObj: {
          SalamanderPass: 'obfs-password',
          Ports: '443-445',
          UpMbps: 10,
          DownMbps: 20,
        },
      }),
      internal('tuic', {
        ...common,
        ConfigType: 8,
        Remarks: 'TUIC internal',
        Username: uuid,
        Password: 'password',
        ProtoExtraObj: { CongestionControl: 'bbr' },
      }),
      internal('wireguard', {
        ...common,
        ConfigType: 9,
        Remarks: 'WireGuard internal',
        Password: 'private-key',
        StreamSecurity: '',
        ProtoExtraObj: {
          WgPublicKey: 'public-key',
          WgPresharedKey: 'preshared-key',
          WgInterfaceAddress: '10.0.0.2/32,fd00::2/128',
          WgReserved: '1,2,3',
          WgMtu: 1280,
        },
      }),
      internal('http', {
        ...common,
        ConfigType: 10,
        Remarks: 'HTTPS internal',
        Username: 'user',
        Password: 'password',
      }),
      internal('anytls', {
        ...common,
        ConfigType: 11,
        Remarks: 'AnyTLS internal',
        Password: 'password',
      }),
    ].join('\n'),
  )

  expect(nodeList.map((node) => node.type)).toEqual([
    NodeTypeEnum.Vmess,
    NodeTypeEnum.Shadowsocks,
    NodeTypeEnum.Socks5,
    NodeTypeEnum.Vless,
    NodeTypeEnum.Trojan,
    NodeTypeEnum.Hysteria2,
    NodeTypeEnum.Tuic,
    NodeTypeEnum.Wireguard,
    NodeTypeEnum.HTTPS,
    NodeTypeEnum.AnyTLS,
  ])
  expect(nodeList).toMatchObject([
    { network: 'ws', wsOpts: { path: '/vmess' } },
    { method: 'aes-128-gcm', password: 'password' },
    { username: 'user', password: 'password' },
    {
      network: 'grpc',
      flow: 'xtls-rprx-vision',
      realityOpts: { publicKey: 'public-key' },
    },
    { network: 'ws', wsPath: '/trojan' },
    {
      obfsPassword: 'obfs-password',
      portHopping: '443-445',
      uploadBandwidth: 10,
      downloadBandwidth: 20,
    },
    { uuid, password: 'password', congestionControl: 'bbr' },
    { selfIp: '10.0.0.2', privateKey: 'private-key', mtu: 1280 },
    { username: 'user', password: 'password' },
    { password: 'password' },
  ])
})

test('parseV2rayNSubscription can restrict the shared parser to Trojan', () => {
  const logger = { warn: vi.fn(), debug: vi.fn() } as any
  const nodeList = parseV2rayNSubscription(
    toBase64(
      [
        `ss://${toUrlSafeBase64('aes-128-gcm:password')}@ss.example.com:8388#SS`,
        'trojan://password@trojan.example.com:443#Trojan',
      ].join('\n'),
    ),
    {
      allowedNodeTypes: new Set([NodeTypeEnum.Trojan]),
      logger,
    },
  )

  expect(nodeList).toMatchObject([
    { type: NodeTypeEnum.Trojan, nodeName: 'Trojan' },
  ])
  expect(logger.warn).not.toHaveBeenCalled()
})
