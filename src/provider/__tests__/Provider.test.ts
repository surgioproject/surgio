import { beforeEach, expect, test, vi } from 'vitest'

import * as config from '../../config'
import { SupportProviderEnum } from '../../types'
import { getUserAgent } from '../../utils/http-client'
import Provider from '../Provider'

class TestProvider extends Provider {
  constructor(name: string, config: any) {
    super(name, config)
  }

  getNodeList = async () => {
    return []
  }

  getNodeListV2 = async () => {
    return {
      nodeList: [],
    }
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

test('Provider determineRequestHeaders always includes user-agent', () => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  const headers = provider.determineRequestHeaders('incoming-ua', {
    'user-agent': 'header-ua',
    'x-custom': 'value',
  })

  expect(headers).toEqual({
    'user-agent': getUserAgent('config-ua'),
  })
})

test('Provider determineRequestHeaders filters headers by allowlist', () => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
  })

  ;(provider as any).passGatewayRequestHeaders = ['accept-language']

  const headers = provider.determineRequestHeaders(undefined, {
    'accept-language': 'en-US',
    'x-custom': 'value',
  })

  expect(headers).toEqual({
    'accept-language': 'en-US',
    'user-agent': getUserAgent(),
  })
})

test('Provider determineRequestHeaders uses requestUserAgent when allowed', () => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  ;(provider as any).passGatewayRequestHeaders = ['user-agent']

  const headers = provider.determineRequestHeaders('param-ua', {
    'user-agent': 'header-ua',
  })

  expect(headers['user-agent']).toBe(getUserAgent('param-ua'))
})

test('Provider determineRequestHeaders falls back to header user-agent', () => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  ;(provider as any).passGatewayRequestHeaders = ['user-agent']

  const headers = provider.determineRequestHeaders(undefined, {
    'user-agent': 'header-ua',
  })

  expect(headers['user-agent']).toBe(getUserAgent('header-ua'))
})

test('Provider determineRequestHeaders falls back to config user-agent', () => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  ;(provider as any).passGatewayRequestHeaders = ['user-agent']

  const headers = provider.determineRequestHeaders()

  expect(headers['user-agent']).toBe(getUserAgent('config-ua'))
})

test('Provider determineRequestHeaders normalizes header casing', () => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
  })

  ;(provider as any).passGatewayRequestHeaders = ['accept-language']

  const headers = provider.determineRequestHeaders(undefined, {
    'Accept-Language': 'en-GB',
  })

  expect(headers).toEqual({
    'accept-language': 'en-GB',
    'user-agent': getUserAgent(),
  })
})
