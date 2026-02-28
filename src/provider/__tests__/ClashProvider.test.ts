import test from 'ava'
import nock from 'nock'
import sinon from 'sinon'

import { NodeTypeEnum, SupportProviderEnum } from '../../types'
import ClashProvider, {
  getClashSubscription,
  parseClashConfig,
} from '../ClashProvider'
import Provider from '../Provider'
import * as config from '../../config'

const sandbox = sinon.createSandbox()

test.beforeEach(() => {
  sandbox.restore()
  sandbox.stub(config, 'getConfig').returns({} as any)
})

test('ClashProvider', async (t) => {
  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
  })

  t.is(provider.type, SupportProviderEnum.Clash)
  t.snapshot(await provider.getNodeList())
})

test('ClashProvider new format', async (t) => {
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

  t.deepEqual(await provider.getNodeList(), [])

  scope.done()
})

test('ClashProvider.getSubscriptionUserInfo', async (t) => {
  let provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample-with-user-info.yaml',
  })
  let userInfo = await provider.getSubscriptionUserInfo()
  t.deepEqual(userInfo, {
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
  t.is(userInfo, void 0)
})

test('getClashSubscription', async (t) => {
  const { nodeList } = await getClashSubscription({
    url: 'http://example.com/clash-sample.yaml',
    requestHeaders: { 'user-agent': 'clash-for-windows' },
    cacheKey: 'test-cache-key',
  })
  const config = [...nodeList]

  t.deepEqual(
    config.map((item) => item.nodeName).join(', '),
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
    ].join(', '),
  )

  t.deepEqual(config.shift(), {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss1',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  })
  t.deepEqual(config.shift(), {
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
  t.deepEqual(config.shift(), {
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
  t.deepEqual(config.shift(), {
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
  t.deepEqual(config.shift(), {
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
  t.deepEqual(config.shift(), {
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
  t.deepEqual(config.shift(), {
    type: NodeTypeEnum.Socks5,
    nodeName: 'socks',
    hostname: 'server',
    port: 443,
  })
  t.deepEqual(config.shift(), {
    type: NodeTypeEnum.HTTPS,
    nodeName: 'http 1',
    hostname: 'server',
    port: 443,
    username: 'username',
    password: 'password',
    skipCertVerify: false,
    tls13: false,
  })
  t.deepEqual(config.shift(), {
    type: NodeTypeEnum.HTTP,
    nodeName: 'http 2',
    hostname: 'server',
    port: 443,
    username: 'username',
    password: 'password',
  })
  t.deepEqual(config.shift(), {
    type: NodeTypeEnum.Snell,
    nodeName: 'snell',
    hostname: 'server',
    port: 44046,
    psk: 'yourpsk',
    obfs: 'http',
  })
  t.deepEqual(config.shift(), {
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
  t.deepEqual(config.shift(), {
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
  t.deepEqual(config.shift(), {
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

test('getClashSubscription udpRelay', async (t) => {
  const { nodeList: config } = await getClashSubscription({
    url: 'http://example.com/clash-sample.yaml',
    requestHeaders: { 'user-agent': 'clash-for-windows' },
    cacheKey: 'test-cache-key',
    udpRelay: true,
  })

  t.deepEqual(config[0], {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: 'ss1',
    hostname: 'server',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  })
  t.deepEqual(config[1], {
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
  t.deepEqual(config[2], {
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
  t.deepEqual(config[3], {
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

test('getClashSubscription - invalid yaml', async (t) => {
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

  await t.throwsAsync(
    async () => {
      await getClashSubscription({
        url: 'http://local/fail-1',
        requestHeaders: { 'user-agent': 'clash-for-windows' },
        cacheKey: 'test-cache-key-1',
      })
    },
    {
      instanceOf: Error,
      message: 'http://local/fail-1 订阅内容有误，请检查后重试',
    },
  )

  await t.throwsAsync(
    async () => {
      await getClashSubscription({
        url: 'http://local/fail-2',
        requestHeaders: { 'user-agent': 'clash-for-windows' },
        cacheKey: 'test-cache-key-2',
      })
    },
    {
      instanceOf: Error,
      message: 'http://local/fail-2 订阅内容有误，请检查后重试',
    },
  )

  scope.done()
})

test('vmess Configurations', (t) => {
  t.deepEqual(
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
    [
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
    ],
  )

  t.deepEqual(
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
    [
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
    ],
  )

  t.deepEqual(
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
    [
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
    ],
  )

  t.deepEqual(
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
    [
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
    ],
  )

  t.deepEqual(
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
    [
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
    ],
  )

  t.deepEqual(
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
    [
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
    ],
  )
})

test('snell Configurations', (t) => {
  t.deepEqual(
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
    [
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
    ],
  )
})

test('trojan configurations', (t) => {
  t.deepEqual(
    parseClashConfig([
      {
        type: 'trojan',
        name: 'trojan',
        server: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    [
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        tls13: false,
        udpRelay: false,
      },
    ],
  )
  t.deepEqual(
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
    [
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
    ],
  )
  t.deepEqual(
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
    [
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
    ],
  )
})

test('ssr', async (t) => {
  t.deepEqual(
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
    [
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
    ],
  )
  t.deepEqual(
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
    [
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
    ],
  )
})

test('shadowsocks v2ray mux', async (t) => {
  t.deepEqual(
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
    [
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
    ],
  )
})

test('ClashProvider relayUrl', async (t) => {
  const provider1 = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
    relayUrl: 'http://relay.com/%URL%',
  })

  t.is(provider1.url, `http://relay.com/http://example.com/clash-sample.yaml`)

  const provider2 = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
    relayUrl: 'http://relay.com/%%URL%%',
  })

  t.is(
    provider2.url,
    `http://relay.com/http%3A%2F%2Fexample.com%2Fclash-sample.yaml`,
  )
})

test.serial('ClashProvider requestUserAgent', async (t) => {
  const mock = sandbox.spy(Provider, 'requestCacheableResource')

  const requestUserAgent = 'test useragent'
  const provider = new ClashProvider('test', {
    type: SupportProviderEnum.Clash,
    url: 'http://example.com/clash-sample.yaml',
    requestUserAgent,
  })

  t.is(provider.config.requestUserAgent, requestUserAgent)

  await t.notThrowsAsync(async () => {
    await provider.getNodeList()
  })

  sandbox.assert.calledWith(
    mock,
    'http://example.com/clash-sample.yaml',
    sinon.match.has('user-agent', sinon.match(/^test useragent surgio\//)),
    sinon.match.string,
  )
})

test.serial(
  'ClashProvider requestUserAgent with passGatewayRequestHeaders',
  async (t) => {
    const mock = sandbox.spy(Provider, 'requestCacheableResource')

    const requestUserAgent = 'test useragent'
    const provider = new ClashProvider('test', {
      type: SupportProviderEnum.Clash,
      url: 'http://example.com/clash-sample.yaml',
    })

    // @ts-expect-error
    provider.passGatewayRequestHeaders = ['user-agent']

    await t.notThrowsAsync(async () => {
      await provider.getNodeList({
        requestUserAgent,
      })
    })

    sandbox.assert.calledWith(
      mock,
      'http://example.com/clash-sample.yaml',
      sinon.match.has('user-agent', sinon.match(/^test useragent surgio\//)),
      sinon.match.string,
    )
  },
)

test.serial(
  'ClashProvider requestUserAgent without passGatewayRequestHeaders',
  async (t) => {
    const mock = sandbox.spy(Provider, 'requestCacheableResource')

    const provider = new ClashProvider('test', {
      type: SupportProviderEnum.Clash,
      url: 'http://example.com/clash-sample.yaml',
    })

    await t.notThrowsAsync(async () => {
      await provider.getNodeList({
        requestHeaders: {
          'x-custom': 'value',
        },
      })
    })

    sandbox.assert.calledWith(
      mock,
      'http://example.com/clash-sample.yaml',
      sinon.match.has('user-agent', sinon.match(/^clash surgio\//)),
      sinon.match.string,
    )
  },
)

test('ClashProvider with hooks', async (t) => {
  const afterNodeListResponse = sinon.spy((nodeList) => {
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
    t.is(node.nodeName, 'override')
  }
  t.true(afterNodeListResponse.calledOnce)
})

test('getClashSubscription - invalid yaml syntax', async (t) => {
  const scope = nock('http://local')
    .get('/fail-3')
    .reply(
      200,
      `
foo: [bar
`,
    )

  await t.throwsAsync(
    async () => {
      await getClashSubscription({
        url: 'http://local/fail-3',
        requestHeaders: { 'user-agent': 'clash-for-windows' },
        cacheKey: 'test-cache-key-3',
      })
    },
    {
      instanceOf: Error,
      message: 'http://local/fail-3 不是一个合法的 YAML 文件',
    },
  )

  scope.done()
})

test('parseClashConfig filters unsupported nodes', (t) => {
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

  t.deepEqual(nodeList, [])
})

test('parseClashConfig socks5 options', (t) => {
  t.deepEqual(
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
    [
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
    ],
  )
})

test('parseClashConfig tuic configurations', (t) => {
  t.deepEqual(
    parseClashConfig([
      {
        type: 'tuic',
        name: 'tuic-v5',
        server: 'example.com',
        port: 443,
        version: 5,
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
    [
      {
        type: NodeTypeEnum.Tuic,
        version: 5,
        nodeName: 'tuic-v5',
        hostname: 'example.com',
        port: 443,
        password: 'password',
        uuid: 'uuid',
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
    ],
  )
})

test('parseClashConfig hysteria2 invalid obfs', (t) => {
  t.throws(
    () => {
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
    },
    {
      instanceOf: Error,
      message:
        '不支持从 Clash 订阅中读取 Hysteria2 节点，因为其 obfs 不是 salamander',
    },
  )
})

test('parseClashConfig anytls options', (t) => {
  t.deepEqual(
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
    [
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
    ],
  )
})
