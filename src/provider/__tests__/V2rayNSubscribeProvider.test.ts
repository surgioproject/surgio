import { beforeEach, expect, test, vi } from 'vitest'

import { SupportProviderEnum } from '../../types'
import * as config from '../../config'
import V2rayNSubscribeProvider, {
  getV2rayNSubscription,
} from '../V2rayNSubscribeProvider'

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
