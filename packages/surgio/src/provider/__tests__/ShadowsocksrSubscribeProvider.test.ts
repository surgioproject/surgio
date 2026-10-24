import { beforeEach, expect, test, vi } from 'vitest'

import { NodeTypeEnum } from '../../types.js'
import * as config from '../../config.js'
import { getShadowsocksrSubscription } from '../ShadowsocksrSubscribeProvider.js'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('getShadowsocksrSubscription', async () => {
  const { nodeList } = await getShadowsocksrSubscription(
    'http://example.com/test-ssr-sub.txt?v=1',
    { 'user-agent': 'shadowrocket' },
    'test-cache-key-1',
    false,
  )
  const { nodeList: nodeList2 } = await getShadowsocksrSubscription(
    'http://example.com/test-ssr-sub.txt?v=2',
    { 'user-agent': 'shadowrocket' },
    'test-cache-key-2',
    true,
  )

  expect(nodeList[0]).toEqual({
    nodeName: '测试中文',
    type: NodeTypeEnum.Shadowsocksr,
    hostname: '127.0.0.1',
    port: '1234',
    method: 'aes-128-cfb',
    password: 'aaabbb',
    obfs: 'tls1.2_ticket_auth',
    obfsparam: 'breakwa11.moe',
    protocol: 'auth_aes128_md5',
    protoparam: '',
    udpRelay: false,
  })
  expect(nodeList2[0]).toEqual({
    nodeName: '测试中文',
    type: NodeTypeEnum.Shadowsocksr,
    hostname: '127.0.0.1',
    port: '1234',
    method: 'aes-128-cfb',
    password: 'aaabbb',
    obfs: 'tls1.2_ticket_auth',
    obfsparam: 'breakwa11.moe',
    protocol: 'auth_aes128_md5',
    protoparam: '',
    udpRelay: true,
  })
})
