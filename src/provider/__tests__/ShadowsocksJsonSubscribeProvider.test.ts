import { beforeEach, expect, test, vi } from 'vitest'
import sinon from 'sinon'

import { NodeTypeEnum } from '../../types'
import * as config from '../../config'
import { getShadowsocksJSONConfig } from '../ShadowsocksJsonSubscribeProvider'

const sandbox = sinon.createSandbox()

beforeEach(() => {
  sandbox.restore()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('getShadowsocksJSONConfig', async () => {
  const config = await getShadowsocksJSONConfig(
    'http://example.com/gui-config.json?v=1',
    { 'user-agent': 'shadowrocket' },
    'test-cache-key-1',
    true,
  )
  const config2 = await getShadowsocksJSONConfig(
    'http://example.com/gui-config.json?v=2',
    { 'user-agent': 'shadowrocket' },
    'test-cache-key-2',
    false,
  )

  expect(config[0]).toEqual({
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'tls',
    obfsHost: 'gateway-carry.icloud.com',
  })
  expect(config[1]).toEqual({
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 444,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
  })
  expect(config[2]).toEqual({
    nodeName: '🇺🇸US 3',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 445,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'tls',
    obfsHost: 'www.bing.com',
  })
  expect(config[3]).toEqual({
    nodeName: '🇺🇸US 4',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 80,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: true,
    obfs: 'http',
    obfsHost: 'www.bing.com',
  })
  expect(config2[0]).toEqual({
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    udpRelay: false,
    obfs: 'tls',
    obfsHost: 'gateway-carry.icloud.com',
  })
})
