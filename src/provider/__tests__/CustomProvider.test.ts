import test from 'ava'
import sinon from 'sinon'

import { NodeTypeEnum, SupportProviderEnum } from '../../types'
import * as config from '../../config'
import CustomProvider from '../CustomProvider'

const sandbox = sinon.createSandbox()

test.beforeEach(() => {
  sandbox.restore()
  sandbox.stub(config, 'getConfig').returns({} as any)
})

test('CustomProvider should work', async (t) => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
  })

  t.deepEqual(await provider.getNodeList(), [])
})

test('CustomProvider underlying proxy', async (t) => {
  t.deepEqual(
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
    [
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
    ],
  )

  t.deepEqual(
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
    [
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
    ],
  )

  t.deepEqual(
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
    [
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
    ],
  )
})

test('CustomProvider with hooks', async (t) => {
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
  const afterNodeListResponse = sinon.spy((nodeList) => {
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

  t.deepEqual(await provider.getNodeList(), [
    {
      ...nodeList[0],
      hostname: 'example.org',
    },
  ])
  t.true(afterNodeListResponse.calledOnce)
})

test('CustomProvider nodeList function receives params', async (t) => {
  const nodeListFn = sinon.stub().resolves([
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

  t.true(nodeListFn.calledOnce)
  t.deepEqual(nodeListFn.firstCall.args[0], params)
})

test('CustomProvider returns list from hook when provided', async (t) => {
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

  t.deepEqual(await provider.getNodeList(), [
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

test('CustomProvider throws for unknown node type', async (t) => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: 'unknown' as NodeTypeEnum,
        nodeName: 'test',
      },
    ] as any,
  })

  const error = await t.throwsAsync(() => provider.getNodeList())
  t.true(error?.message.includes('节点配置校验失败'))
})

test('CustomProvider applies vmess compatibility rules', async (t) => {
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

  t.deepEqual(await provider.getNodeList(), [
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

test('CustomProvider rejects conflicting vmess ws headers', async (t) => {
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

  const error = await t.throwsAsync(() => provider.getNodeList())
  t.true(error?.message.includes('节点配置校验失败'))
})

test('CustomProvider rejects vmess path on ws network', async (t) => {
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

  const error = await t.throwsAsync(() => provider.getNodeList())
  t.true(error?.message.includes('节点配置校验失败'))
})
