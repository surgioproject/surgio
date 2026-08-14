import { beforeEach, expect, test, vi } from 'vitest'

import { SupportProviderEnum } from '../../types'
import * as config from '../../config'
import SsdProvider from '../SsdProvider'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('SsdProvider 1', async () => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
  })
  const nodeList = await provider.getNodeList()

  expect(nodeList).toMatchSnapshot()
})

test('SsdProvider 2', async () => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample-2.txt',
  })
  const nodeList = await provider.getNodeList()

  expect(nodeList).toMatchSnapshot()
})

test('SsdProvider udpRelay', async () => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
    udpRelay: true,
  })
  const nodeList = await provider.getNodeList()

  expect(nodeList).toMatchSnapshot()
})

test('SsdProvider.getSubscriptionUserInfo', async () => {
  const provider = new SsdProvider('test', {
    type: SupportProviderEnum.Ssd,
    url: 'http://example.com/ssd-sample.txt',
  })
  const userInfo = await provider.getSubscriptionUserInfo()

  expect(userInfo?.upload).toBe(0)
  expect(userInfo?.download).toBe(32212254720)
  expect(userInfo?.total).toBe(429496729600)
})
