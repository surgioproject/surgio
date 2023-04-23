import test from 'ava'
import sinon from 'sinon'
import * as config from '../../config'

import { getShadowsocksSubscription } from '../ShadowsocksSubscribeProvider'
import { NodeTypeEnum } from '../../types'

const sandbox = sinon.createSandbox()

test.beforeEach(() => {
  sandbox.restore()
  sandbox.stub(config, 'getConfig').returns({} as any)
})

test('getShadowsocksSubscription with udp', async (t) => {
  const { nodeList } = await getShadowsocksSubscription(
    'http://example.com/test-ss-sub.txt',
    true,
  )

  t.deepEqual(nodeList[0], {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: '🇺🇸US 1',
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'tls',
    obfsHost: 'gateway-carry.icloud.com',
  })
  t.deepEqual(nodeList[1], {
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  })
  t.deepEqual(nodeList[2], {
    nodeName: '🇺🇸US 3',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'wss',
    obfsHost: 'gateway-carry.icloud.com',
  })
})

test('getShadowsocksSubscription without udp', async (t) => {
  const { nodeList } = await getShadowsocksSubscription(
    'http://example.com/test-ss-sub.txt',
  )

  t.deepEqual(nodeList[0], {
    type: NodeTypeEnum.Shadowsocks,
    nodeName: '🇺🇸US 1',
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    obfs: 'tls',
    obfsHost: 'gateway-carry.icloud.com',
  })
  t.deepEqual(nodeList[1], {
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
  })
})
