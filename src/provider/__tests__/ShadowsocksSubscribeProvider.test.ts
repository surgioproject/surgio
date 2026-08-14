import { beforeEach, expect, test, vi } from 'vitest'

import * as config from '../../config'
import { getShadowsocksSubscription } from '../ShadowsocksSubscribeProvider'
import { NodeTypeEnum } from '../../types'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('getShadowsocksSubscription with udp', async () => {
  const { nodeList } = await getShadowsocksSubscription(
    'http://example.com/test-ss-sub.txt',
    { 'user-agent': 'shadowrocket' },
    'test-cache-key',
    true,
  )

  expect(nodeList[0]).toEqual({
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
  expect(nodeList[1]).toEqual({
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  })
  expect(nodeList[2]).toEqual({
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

test('getShadowsocksSubscription without udp', async () => {
  const { nodeList } = await getShadowsocksSubscription(
    'http://example.com/test-ss-sub.txt',
    { 'user-agent': 'shadowrocket' },
    'test-cache-key',
  )

  expect(nodeList[0]).toEqual({
    type: NodeTypeEnum.Shadowsocks,
    nodeName: '🇺🇸US 1',
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    obfs: 'tls',
    obfsHost: 'gateway-carry.icloud.com',
  })
  expect(nodeList[1]).toEqual({
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: '443',
    method: 'chacha20-ietf-poly1305',
    password: 'password',
  })
})
