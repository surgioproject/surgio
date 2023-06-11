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

test('CustomProvider should format header keys to lowercase', async (t) => {
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
        wsHeaders: {
          Host: 'Example.com',
        },
      },
    ],
  })

  t.deepEqual(await provider.getNodeList(), [
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      wsHeaders: {
        host: 'Example.com',
      },
    },
  ])
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
