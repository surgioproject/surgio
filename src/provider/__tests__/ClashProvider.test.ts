import { beforeEach, expect, test, vi } from 'vitest'
import nock from 'nock'

import { NodeTypeEnum, SupportProviderEnum } from '../../types.js'
import ClashProvider, {
  getClashSubscription,
  parseClashConfig,
} from '../ClashProvider.js'
import Provider from '../Provider.js'
import * as config from '../../config.js'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('ClashProvider', async () => {
  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
  })

  expect(provider.type).toBe(SupportProviderEnum.Clash)
  expect(await provider.getNodeList()).toMatchSnapshot()
})

test('ClashProvider new format', async () => {
  const scope = nock('http://local')
    .get('/success-1')
    .reply(
      200,
      `
proxies: []
    `,
    )

  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://local/success-1',
  })

  expect(await provider.getNodeList()).toEqual([])

  scope.done()
})

test('ClashProvider.getSubscriptionUserInfo', async () => {
  let provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample-with-user-info.yaml',
  })
  let userInfo = await provider.getSubscriptionUserInfo()
  expect(userInfo).toEqual({
    upload: 891332010,
    download: 29921186546,
    total: 322122547200,
    expire: 1586330887,
  })

  provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
  })
  userInfo = await provider.getSubscriptionUserInfo()
  expect(userInfo).toBe(void 0)
})

test('getClashSubscription', async () => {
  const { nodeList } = await getClashSubscription({
    url: 'http://example.com/clash-sample.yaml',
    requestHeaders: { 'user-agent': 'clash-for-windows' },
    cacheKey: 'test-cache-key',
  })
  const config = [...nodeList]

  expect(config.map((item) => item.nodeName).join(', ')).toEqual(
    [
      'ss1',
      'ss2',
      'ss3',
      'vmess',
      'vmess new format',
      'vmess custom header',
      'socks',
      'http 1',
      'http 2',
      'snell',
      'ss4',
      'ss-wss',
      'hysteria2',
      'vless',
    ].join(', '),
  )

  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss1',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss2',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: false,
    obfs: 'tls',
    obfsHost: 'www.bing.com',
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss3',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: false,
    obfs: 'ws',
    obfsHost: 'server',
    obfsUri: '/',
    wsHeaders: {},
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Vmess,
    nodeName: 'vmess',
    hostname: 'server',
    port: 443,
    uuid: 'uuid',
    alterId: '32',
    method: 'auto',
    tls: false,
    network: 'tcp',
    udpRelay: false,
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Vmess,
    nodeName: 'vmess new format',
    hostname: 'server',
    port: 443,
    uuid: 'uuid',
    alterId: '32',
    method: 'auto',
    network: 'ws',
    udpRelay: true,
    tls: true,
    tls13: false,
    skipCertVerify: true,
    wsOpts: {
      headers: {
        Host: 'v2ray.com',
      },
      path: '/path',
      'early-data-header-name': 'Sec-WebSocket-Protocol',
      'max-early-data': 2048,
    },
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Vmess,
    nodeName: 'vmess custom header',
    hostname: 'server',
    port: 443,
    uuid: 'uuid',
    alterId: '32',
    method: 'auto',
    network: 'ws',
    udpRelay: false,
    tls: true,
    tls13: false,
    skipCertVerify: false,
    wsOpts: {
      headers: {
        edge: 'www.baidu.com',
      },
      path: '/path',
    },
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Socks5,
    nodeName: 'socks',
    hostname: 'server',
    port: 443,
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.HTTPS,
    nodeName: 'http 1',
    hostname: 'server',
    port: 443,
    username: 'username',
    password: 'password',
    skipCertVerify: false,
    tls13: false,
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.HTTP,
    nodeName: 'http 2',
    hostname: 'server',
    port: 443,
    username: 'username',
    password: 'password',
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Snell,
    nodeName: 'snell',
    hostname: 'server',
    port: 44046,
    psk: 'yourpsk',
    obfs: 'http',
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss4',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: false,
    obfs: 'tls',
    obfsHost: 'example.com',
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss-wss',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: false,
    obfs: 'wss',
    obfsHost: 'cloudflare.com',
    obfsUri: '/ws',
    skipCertVerify: false,
    tls13: false,
    wsHeaders: {},
  })
  expect(config.shift()).toEqual({
    type: NodeTypeEnum.Hysteria2,
    downloadBandwidth: 200,
    uploadBandwidth: 30,
    hostname: 'server.com',
    nodeName: 'hysteria2',
    password: 'yourpassword',
    port: 443,
    obfs: 'salamander',
    obfsPassword: 'yourpassword',
    alpn: ['h3'],
    skipCertVerify: false,
    sni: 'server.com',
    portHopping: '5000-6000;7000',
    portHoppingInterval: 10,
  })
})

test('getClashSubscription udpRelay', async () => {
  const { nodeList: config } = await getClashSubscription({
    url: 'http://example.com/clash-sample.yaml',
    requestHeaders: { 'user-agent': 'clash-for-windows' },
    cacheKey: 'test-cache-key',
    udpRelay: true,
  })

  expect(config[0]).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss1',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  })
  expect(config[1]).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss2',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'tls',
    obfsHost: 'www.bing.com',
  })
  expect(config[2]).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss3',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'ws',
    obfsHost: 'server',
    obfsUri: '/',
    wsHeaders: {},
  })
  expect(config[3]).toEqual({
    type: NodeTypeEnum.Vmess,
    nodeName: 'vmess',
    hostname: 'server',
    port: 443,
    uuid: 'uuid',
    alterId: '32',
    method: 'auto',
    tls: false,
    network: 'tcp',
    udpRelay: true,
  })
})

test('getClashSubscription keeps reality short-id as plain string', async () => {
  const scope = nock('http://local')
    .get('/short-id')
    .reply(
      200,
      `
proxies:
  - name: "short-id numeric"
    type: vless
    server: server.com
    port: 443
    tls: true
    uuid: uuid-1
    flow: xtls-rprx-vision
    reality-opts:
      public-key: publicKey1
      short-id: 09561058
    client-fingerprint: chrome
  - name: "short-id quoted"
    type: vless
    server: server.com
    port: 443
    tls: true
    uuid: uuid-2
    flow: xtls-rprx-vision
    reality-opts:
      public-key: publicKey2
      short-id: '12'
    client-fingerprint: chrome
    `,
    )

  const { nodeList } = await getClashSubscription({
    url: 'http://local/short-id',
    requestHeaders: { 'user-agent': 'clash-for-windows' },
    cacheKey: 'test-cache-key-short-id',
  })

  expect(
    nodeList.map((node) =>
      node.type === NodeTypeEnum.Vless ? node.realityOpts?.shortId : undefined,
    ),
  ).toEqual(['09561058', '12'])

  scope.done()
})

test('getClashSubscription - invalid yaml', async () => {
  const scope = nock('http://local')
    .get('/fail-1')
    .reply(200, '')
    .get('/fail-2')
    .reply(
      200,
      `
foo: bar
    `,
    )

  await expect(
    getClashSubscription({
      url: 'http://local/fail-1',
      requestHeaders: { 'user-agent': 'clash-for-windows' },
      cacheKey: 'test-cache-key-1',
    }),
  ).rejects.toThrow('http://local/fail-1 订阅内容有误，请检查后重试')

  await expect(
    getClashSubscription({
      url: 'http://local/fail-2',
      requestHeaders: { 'user-agent': 'clash-for-windows' },
      cacheKey: 'test-cache-key-2',
    }),
  ).rejects.toThrow('http://local/fail-2 订阅内容有误，请检查后重试')

  scope.done()
})

test('vmess Configurations', () => {
  expect(
    parseClashConfig([
      {
        type: 'vmess',
        name: 'vmess meta alpn',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        alterId: 32,
        cipher: 'auto',
        network: 'tcp',
        tls: true,
        alpn: ['h2', 'http/1.1'],
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Vmess,
      nodeName: 'vmess meta alpn',
      hostname: 'server',
      port: 443,
      uuid: 'uuid',
      alterId: '32',
      method: 'auto',
      network: 'tcp',
      tls: true,
      alpn: ['h2', 'http/1.1'],
      udpRelay: false,
      skipCertVerify: false,
      tls13: false,
    },
  ])

  expect(
    parseClashConfig([
      {
        type: 'vless',
        name: 'vless alpn',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        cipher: 'none',
        network: 'tcp',
        tls: true,
        alpn: ['h2'],
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Vless,
      nodeName: 'vless alpn',
      hostname: 'server',
      port: 443,
      uuid: 'uuid',
      method: 'none',
      network: 'tcp',
      alpn: ['h2'],
      udpRelay: false,
      skipCertVerify: false,
      tls13: false,
    },
  ])

  expect(
    parseClashConfig([
      {
        type: 'vmess',
        name: 'vmess',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        alterId: 32,
        cipher: 'auto',
        network: 'http',
        'http-opts': {
          path: ['/path'],
          headers: {
            host: ['v2ray.com'],
          },
        },
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Vmess,
      nodeName: 'vmess',
      hostname: 'server',
      port: 443,
      uuid: 'uuid',
      alterId: '32',
      method: 'auto',
      network: 'http',
      tls: false,
      udpRelay: false,
      httpOpts: {
        path: ['/path'],
        headers: {
          host: 'v2ray.com',
        },
      },
    },
  ])

  expect(
    parseClashConfig([
      {
        type: 'vmess',
        name: 'vmess',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        alterId: 32,
        cipher: 'auto',
        network: 'grpc',
        'grpc-opts': {
          'grpc-service-name': 'service',
        },
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Vmess,
      nodeName: 'vmess',
      hostname: 'server',
      port: 443,
      uuid: 'uuid',
      alterId: '32',
      method: 'auto',
      network: 'grpc',
      tls: false,
      udpRelay: false,
      grpcOpts: {
        serviceName: 'service',
      },
    },
  ])

  expect(
    parseClashConfig([
      {
        type: 'vmess',
        name: 'vmess',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        alterId: 32,
        cipher: 'auto',
        network: 'h2',
        'h2-opts': {
          path: '/path',
          host: ['v2ray.com'],
        },
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Vmess,
      nodeName: 'vmess',
      hostname: 'server',
      port: 443,
      uuid: 'uuid',
      alterId: '32',
      method: 'auto',
      network: 'h2',
      tls: false,
      udpRelay: false,
      h2Opts: {
        path: '/path',
        host: ['v2ray.com'],
      },
    },
  ])

  expect(
    parseClashConfig([
      {
        type: 'vless',
        name: 'vless',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        cipher: 'none',
        flow: 'xtls-rprx-direct',
        udp: true,
        tls: true,
        network: 'h2',
        'client-fingerprint': 'chrome',
        'h2-opts': {
          path: '/path',
          host: ['v2ray.com'],
        },
        'reality-opts': {
          'public-key': 'publicKey',
          'short-id': 'shortId',
        },
        encryption: 'encryption',
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Vless,
      nodeName: 'vless',
      hostname: 'server',
      port: 443,
      uuid: 'uuid',
      method: 'none',
      network: 'h2',
      udpRelay: true,
      flow: 'xtls-rprx-direct',
      clientFingerprint: 'chrome',
      h2Opts: {
        path: '/path',
        host: ['v2ray.com'],
      },
      skipCertVerify: false,
      tls13: false,
      realityOpts: {
        publicKey: 'publicKey',
        shortId: 'shortId',
        spiderX: undefined,
      },
      encryption: 'encryption',
    },
  ])

  expect(
    parseClashConfig([
      {
        type: 'vless',
        name: 'vless-xhttp',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        cipher: 'none',
        udp: true,
        tls: true,
        network: 'xhttp',
        'client-fingerprint': 'chrome',
        'packet-encoding': 'xudp',
        'xhttp-opts': {
          path: '/xhttp',
          mode: 'auto',
        },
        'ech-opts': {
          enable: true,
          config: 'ech-config',
        },
        encryption: 'none',
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Vless,
      nodeName: 'vless-xhttp',
      hostname: 'server',
      port: 443,
      uuid: 'uuid',
      method: 'none',
      network: 'xhttp',
      udpRelay: true,
      clientFingerprint: 'chrome',
      packetEncoding: 'xudp',
      xhttpOpts: {
        path: '/xhttp',
        mode: 'auto',
      },
      echOpts: {
        enable: true,
        config: 'ech-config',
      },
      skipCertVerify: false,
      tls13: false,
      encryption: 'none',
    },
  ])

  expect(
    parseClashConfig([
      {
        type: 'vmess',
        name: 'vmess-xhttp',
        server: 'server',
        port: 443,
        uuid: 'uuid',
        cipher: 'auto',
        network: 'xhttp',
      },
    ]),
  ).toEqual([])
})

test('snell Configurations', () => {
  expect(
    parseClashConfig([
      {
        type: 'snell',
        name: 'snell',
        server: 'server',
        port: 44046,
        psk: 'yourpsk',
        'obfs-opts': {
          mode: 'tls',
          host: 'example.com',
        },
        version: '2',
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Snell,
      nodeName: 'snell',
      hostname: 'server',
      port: 44046,
      psk: 'yourpsk',
      obfs: 'tls',
      obfsHost: 'example.com',
      version: '2',
    },
  ])
})

test('trojan configurations', () => {
  expect(
    parseClashConfig([
      {
        type: 'trojan',
        name: 'trojan',
        server: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Trojan,
      nodeName: 'trojan',
      hostname: 'example.com',
      port: 443,
      password: 'password1',
      tls13: false,
      udpRelay: false,
    },
  ])
  expect(
    parseClashConfig([
      {
        type: 'trojan',
        name: 'trojan',
        server: 'example.com',
        port: 443,
        password: 'password1',
        'skip-cert-verify': true,
        alpn: ['http/1.1'],
        sni: 'sni.example.com',
        udp: true,
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Trojan,
      nodeName: 'trojan',
      hostname: 'example.com',
      port: 443,
      password: 'password1',
      skipCertVerify: true,
      alpn: ['http/1.1'],
      sni: 'sni.example.com',
      udpRelay: true,
      tls13: false,
    },
  ])
  expect(
    parseClashConfig(
      [
        {
          type: 'trojan',
          name: 'trojan',
          server: 'example.com',
          port: 443,
          password: 'password1',
          'skip-cert-verify': true,
          alpn: ['http/1.1'],
          sni: 'sni.example.com',
          udp: false,
        },
      ],
      true,
      true,
    ),
  ).toEqual([
    {
      type: NodeTypeEnum.Trojan,
      nodeName: 'trojan',
      hostname: 'example.com',
      port: 443,
      password: 'password1',
      skipCertVerify: true,
      alpn: ['http/1.1'],
      sni: 'sni.example.com',
      udpRelay: false,
      tls13: true,
    },
  ])
})

test('ssr', async () => {
  expect(
    parseClashConfig([
      {
        name: 'ssr',
        type: 'ssr',
        server: 'server',
        port: 443,
        cipher: 'chacha20-ietf',
        password: 'password',
        obfs: 'tls1.2_ticket_auth',
        protocol: 'auth_sha1_v4',
        'obfs-param': 'domain.tld',
        'protocol-param': '#',
        udp: false,
      },
    ]),
  ).toEqual([
    {
      nodeName: 'ssr',
      hostname: 'server',
      method: 'chacha20-ietf',
      obfs: 'tls1.2_ticket_auth',
      obfsparam: 'domain.tld',
      password: 'password',
      port: 443,
      protocol: 'auth_sha1_v4',
      protoparam: '#',
      type: NodeTypeEnum.Shadowsocksr,
      udpRelay: false,
    },
  ])
  expect(
    parseClashConfig([
      {
        name: 'ssr',
        type: 'ssr',
        server: 'server',
        port: 443,
        cipher: 'chacha20-ietf',
        password: 'password',
        obfs: 'tls1.2_ticket_auth',
        protocol: 'auth_sha1_v4',
        obfsparam: 'domain.tld',
        protocolparam: '#',
        udp: true,
      },
    ]),
  ).toEqual([
    {
      nodeName: 'ssr',
      hostname: 'server',
      method: 'chacha20-ietf',
      obfs: 'tls1.2_ticket_auth',
      obfsparam: 'domain.tld',
      password: 'password',
      port: 443,
      protocol: 'auth_sha1_v4',
      protoparam: '#',
      type: NodeTypeEnum.Shadowsocksr,
      udpRelay: true,
    },
  ])
})

test('shadowsocks v2ray mux', async () => {
  expect(
    parseClashConfig([
      {
        name: 'ss-v2ray-mux',
        type: 'ss',
        server: 'server',
        port: 443,
        cipher: 'chacha20-ietf-poly1305',
        password: 'password',
        plugin: 'v2ray-plugin',
        'plugin-opts': {
          mode: 'websocket',
          mux: true,
          tls: true,
          headers: {
            custom: 'value',
          },
          'skip-cert-verify': true,
        },
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'ss-v2ray-mux',
      hostname: 'server',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'wss',
      obfsHost: 'server',
      obfsUri: '/',
      mux: true,
      udpRelay: false,
      skipCertVerify: true,
      tls13: false,
      wsHeaders: {
        custom: 'value',
      },
    },
  ])
})

test('ClashProvider relayUrl', async () => {
  const provider1 = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
    relayUrl: 'http://relay.com/%URL%',
  })

  expect(provider1.url).toBe(
    `http://relay.com/http://example.com/clash-sample.yaml`,
  )

  const provider2 = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
    relayUrl: 'http://relay.com/%%URL%%',
  })

  expect(provider2.url).toBe(
    `http://relay.com/http%3A%2F%2Fexample.com%2Fclash-sample.yaml`,
  )
})

test('ClashProvider requestUserAgent', async () => {
  const mock = vi.spyOn(Provider, 'requestCacheableResource')

  const requestUserAgent = 'test useragent'
  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
    requestUserAgent,
  })

  expect(provider.config.requestUserAgent).toBe(requestUserAgent)

  await provider.getNodeList()

  expect(mock).toHaveBeenCalledWith(
    'http://example.com/clash-sample.yaml',
    expect.objectContaining({
      'user-agent': expect.stringMatching(/^test useragent surgio\//),
    }),
    expect.any(String),
  )
})

test('ClashProvider requestUserAgent with passGatewayRequestHeaders', async () => {
  const mock = vi.spyOn(Provider, 'requestCacheableResource')

  const requestUserAgent = 'test useragent'
  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
  })

  // @ts-expect-error
  provider.passGatewayRequestHeaders = ['user-agent']

  await provider.getNodeList({
    requestUserAgent,
  })

  expect(mock).toHaveBeenCalledWith(
    'http://example.com/clash-sample.yaml',
    expect.objectContaining({
      'user-agent': expect.stringMatching(/^test useragent surgio\//),
    }),
    expect.any(String),
  )
})

test('ClashProvider requestUserAgent without passGatewayRequestHeaders', async () => {
  const mock = vi.spyOn(Provider, 'requestCacheableResource')

  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
  })

  await provider.getNodeList({
    requestHeaders: {
      'x-custom': 'value',
    },
  })

  expect(mock).toHaveBeenCalledWith(
    'http://example.com/clash-sample.yaml',
    expect.objectContaining({
      'user-agent': expect.stringMatching(/^clash surgio\//),
    }),
    expect.any(String),
  )
})

test('ClashProvider with hooks', async () => {
  const afterNodeListResponse = vi.fn((nodeList) => {
    nodeList.forEach((node: any) => {
      node.nodeName = 'override'
    })
  })
  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
    hooks: {
      afterNodeListResponse,
    },
  })

  const nodeList = await provider.getNodeList()
  for (const node of nodeList) {
    expect(node.nodeName).toBe('override')
  }
  expect(afterNodeListResponse).toHaveBeenCalledOnce()
})

test('getClashSubscription - invalid yaml syntax', async () => {
  const scope = nock('http://local')
    .get('/fail-3')
    .reply(
      200,
      `
foo: [bar
`,
    )

  await expect(
    getClashSubscription({
      url: 'http://local/fail-3',
      requestHeaders: { 'user-agent': 'clash-for-windows' },
      cacheKey: 'test-cache-key-3',
    }),
  ).rejects.toThrow('http://local/fail-3 不是一个合法的 YAML 文件')

  scope.done()
})

test('parseClashConfig filters unsupported nodes', () => {
  const nodeList = parseClashConfig([
    {
      type: 'ss',
      name: 'unsupported-plugin',
      server: 'server',
      port: 443,
      cipher: 'chacha20-ietf-poly1305',
      password: 'password',
      plugin: 'shadow-tls',
      'plugin-opts': {},
    },
    {
      type: 'ss',
      name: 'quic-plugin',
      server: 'server',
      port: 443,
      cipher: 'chacha20-ietf-poly1305',
      password: 'password',
      plugin: 'v2ray-plugin',
      'plugin-opts': {
        mode: 'quic',
      },
    },
    {
      type: 'vmess',
      name: 'unsupported-network',
      server: 'server',
      port: 443,
      uuid: 'uuid',
      alterId: 0,
      cipher: 'auto',
      network: 'quic',
    },
    {
      type: 'vless',
      name: 'vless-no-tls',
      server: 'server',
      port: 443,
      uuid: 'uuid',
      tls: false,
    },
    {
      type: 'vless',
      name: 'reality-no-fingerprint',
      server: 'server',
      port: 443,
      uuid: 'uuid',
      tls: true,
      'reality-opts': {
        'public-key': 'publicKey',
        'short-id': 'shortId',
      },
    },
    {
      type: 'unknown',
      name: 'unknown',
    },
  ])

  expect(nodeList).toEqual([])
})

test('parseClashConfig socks5 options', () => {
  expect(
    parseClashConfig([
      {
        type: 'socks5',
        name: 'socks5',
        server: 'server',
        port: 443,
        username: 'user',
        password: 'pass',
        udp: true,
        tls: true,
        'skip-cert-verify': true,
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Socks5,
      nodeName: 'socks5',
      hostname: 'server',
      port: 443,
      username: 'user',
      password: 'pass',
      udpRelay: true,
      tls: true,
      skipCertVerify: true,
    },
  ])
})

test('parseClashConfig tuic configurations', () => {
  expect(
    parseClashConfig([
      {
        type: 'tuic',
        name: 'tuic-v5',
        server: 'example.com',
        port: 443,
        uuid: 'uuid',
        password: 'password',
        'skip-cert-verify': true,
        sni: 'sni.example.com',
        alpn: ['h3'],
        ports: '4000-5000',
        'hop-interval': 5,
      },
      {
        type: 'tuic',
        name: 'tuic-v4',
        server: 'example.com',
        port: 443,
        token: 'token',
        'skip-cert-verify': true,
        sni: 'sni.example.com',
        alpn: ['h3'],
        ports: '4000-5000',
        'hop-interval': 5,
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Tuic,
      nodeName: 'tuic-v5',
      hostname: 'example.com',
      port: 443,
      password: 'password',
      uuid: 'uuid',
      version: 5,
      skipCertVerify: true,
      tls13: false,
      sni: 'sni.example.com',
      alpn: ['h3'],
      portHopping: '4000-5000',
      portHoppingInterval: 5,
    },
    {
      type: NodeTypeEnum.Tuic,
      nodeName: 'tuic-v4',
      hostname: 'example.com',
      port: 443,
      token: 'token',
      skipCertVerify: true,
      tls13: false,
      sni: 'sni.example.com',
      alpn: ['h3'],
      portHopping: '4000-5000',
      portHoppingInterval: 5,
    },
  ])
})

test('parseClashConfig hysteria2 invalid obfs', () => {
  expect(() => {
    parseClashConfig([
      {
        type: 'hysteria2',
        name: 'hysteria2',
        server: 'server.com',
        port: 443,
        auth: 'password',
        obfs: 'plain',
      },
    ])
  }).toThrow(
    '不支持从 Clash 订阅中读取 Hysteria2 节点，因为其 obfs 不是 salamander',
  )
})

test('parseClashConfig anytls options', () => {
  expect(
    parseClashConfig([
      {
        type: 'anytls',
        name: 'anytls',
        server: 'server',
        port: 443,
        password: 'password',
        udp: false,
        'skip-cert-verify': false,
        'idle-session-check-interval': 0,
        'idle-session-timeout': 0,
        'min-idle-session': 0,
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.AnyTLS,
      nodeName: 'anytls',
      hostname: 'server',
      port: 443,
      password: 'password',
      udpRelay: false,
      tls13: false,
      skipCertVerify: false,
      idleSessionCheckInterval: 0,
      idleSessionTimeout: 0,
      minIdleSessions: 0,
    },
  ])
})

test('parseClashConfig masque options', () => {
  expect(
    parseClashConfig([
      {
        type: 'masque',
        name: 'masque',
        server: 'server.com',
        port: 443,
        'private-key': 'private-key',
        'public-key': 'public-key',
        ip: '172.16.0.2/32',
        ipv6: 'fd00::2/128',
        dns: '1.1.1.1',
        network: 'quic',
        sni: 'masque.example.com',
        'connect-uri': 'https://cloudflareaccess.com',
        mtu: 1280,
        keepalive: 30,
        udp: true,
        'remote-dns-resolve': true,
        'congestion-controller': 'bbr',
        'bbr-profile': 'conservative',
        'handshake-timeout': 20,
        'dialer-proxy': 'upstream',
      },
      {
        type: 'masque',
        name: 'masque-h3-l4proxy',
        server: 'server.com',
        port: 443,
        'private-key': 'private-key',
        'public-key': 'public-key',
        network: 'h3-l4proxy',
        udp: false,
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Masque,
      authMode: 'key-pair',
      nodeName: 'masque',
      hostname: 'server.com',
      port: 443,
      privateKey: 'private-key',
      publicKey: 'public-key',
      ip: '172.16.0.2/32',
      ipv6: 'fd00::2/128',
      dnsServers: ['1.1.1.1'],
      network: 'h3',
      sni: 'masque.example.com',
      connectUri: 'https://cloudflareaccess.com',
      mtu: 1280,
      keepalive: 30,
      udpRelay: true,
      remoteDnsResolve: true,
      congestionController: 'bbr',
      bbrProfile: 'conservative',
      handshakeTimeout: 20,
      underlyingProxy: 'upstream',
    },
    {
      type: NodeTypeEnum.Masque,
      authMode: 'key-pair',
      nodeName: 'masque-h3-l4proxy',
      hostname: 'server.com',
      port: 443,
      privateKey: 'private-key',
      publicKey: 'public-key',
      network: 'h3-l4proxy',
      udpRelay: false,
    },
  ])
})

test('parseClashConfig TrustTunnel options', () => {
  expect(
    parseClashConfig([
      {
        type: 'trusttunnel',
        name: 'stash-trust',
        server: 'stash.example.com',
        port: 443,
        username: 'stash-user',
        password: 'stash-pass',
        quic: true,
        alpn: ['h3'],
        sni: 'sni.stash.example.com',
        'skip-cert-verify': true,
        'server-cert-fingerprint': 'stash-sha256',
        ports: '443,8443,5000-6000',
        'hop-interval': 30,
        'dialer-proxy': 'stash-upstream',
      },
      {
        type: 'trusttunnel',
        name: 'mihomo-trust',
        server: 'mihomo.example.com',
        port: 8443,
        username: 'mihomo-user',
        password: 'mihomo-pass',
        quic: true,
        alpn: ['h3'],
        udp: true,
        fingerprint: 'mihomo-sha256',
        'client-fingerprint': 'chrome',
        'health-check': true,
        'name-cert-verify': 'verify.example.com',
        'congestion-controller': 'bbr',
        'bbr-profile': 'aggressive',
        'max-connections': 8,
        'min-streams': 5,
        'dialer-proxy': 'mihomo-upstream',
        'interface-name': 'en0',
        'ip-version': 'ipv4-prefer',
        tfo: true,
        mptcp: true,
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.TrustTunnel,
      nodeName: 'stash-trust',
      hostname: 'stash.example.com',
      port: 443,
      username: 'stash-user',
      password: 'stash-pass',
      quic: true,
      alpn: ['h3'],
      sni: 'sni.stash.example.com',
      skipCertVerify: true,
      serverCertFingerprintSha256: 'stash-sha256',
      portHopping: '443;8443;5000-6000',
      portHoppingInterval: 30,
      underlyingProxy: 'stash-upstream',
    },
    {
      type: NodeTypeEnum.TrustTunnel,
      nodeName: 'mihomo-trust',
      hostname: 'mihomo.example.com',
      port: 8443,
      username: 'mihomo-user',
      password: 'mihomo-pass',
      quic: true,
      alpn: ['h3'],
      udpRelay: true,
      serverCertFingerprintSha256: 'mihomo-sha256',
      clientFingerprint: 'chrome',
      healthCheck: true,
      nameCertVerify: 'verify.example.com',
      congestionController: 'bbr',
      bbrProfile: 'aggressive',
      maxConnections: 8,
      minStreams: 5,
      underlyingProxy: 'mihomo-upstream',
      interfaceName: 'en0',
      ipVersion: 'ipv4-prefer',
      tfo: true,
      mptcp: true,
    },
  ])
})

test('parseClashConfig tailscale options', () => {
  expect(
    parseClashConfig([
      {
        type: 'tailscale',
        name: 'stash-tailnet',
        hostname: 'stash-node',
        ephemeral: false,
      },
      {
        type: 'tailscale',
        name: 'mihomo-tailnet',
        'auth-key': 'tskey-auth-example',
        hostname: 'mihomo-node',
        'control-url': 'https://controlplane.tailscale.com',
        'state-dir': './tailscale',
        ephemeral: false,
        udp: false,
        'accept-routes': true,
        'exit-node': 'auto:any',
        'exit-node-allow-lan-access': false,
        'dialer-proxy': 'upstream',
        'interface-name': 'WLAN',
        'routing-mark': 0,
        'ip-version': 'ipv4-prefer',
      },
    ]),
  ).toEqual([
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'stash-tailnet',
      hostname: 'stash-node',
      ephemeral: false,
    },
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'mihomo-tailnet',
      authKey: 'tskey-auth-example',
      hostname: 'mihomo-node',
      controlUrl: 'https://controlplane.tailscale.com',
      stateDir: './tailscale',
      ephemeral: false,
      udpRelay: false,
      acceptRoutes: true,
      exitNode: 'auto:any',
      exitNodeAllowLanAccess: false,
      underlyingProxy: 'upstream',
      interfaceName: 'WLAN',
      routingMark: 0,
      ipVersion: 'ipv4-prefer',
    },
  ])
})
