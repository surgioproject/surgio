import test from 'ava'
import sinon from 'sinon'

import * as config from '../../config'
import { SupportProviderEnum } from '../../types'
import { getUserAgent } from '../../utils/http-client'
import Provider from '../Provider'

const sandbox = sinon.createSandbox()

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

test.beforeEach(() => {
  sandbox.restore()
  sandbox.stub(config, 'getConfig').returns({} as any)
})

test('Provider determineRequestHeaders always includes user-agent', (t) => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  const headers = provider.determineRequestHeaders('incoming-ua', {
    'user-agent': 'header-ua',
    'x-custom': 'value',
  })

  t.deepEqual(headers, {
    'user-agent': getUserAgent('config-ua'),
  })
})

test('Provider determineRequestHeaders filters headers by allowlist', (t) => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
  })

  ;(provider as any).passGatewayRequestHeaders = ['accept-language']

  const headers = provider.determineRequestHeaders(undefined, {
    'accept-language': 'en-US',
    'x-custom': 'value',
  })

  t.deepEqual(headers, {
    'accept-language': 'en-US',
    'user-agent': getUserAgent(),
  })
})

test('Provider determineRequestHeaders uses requestUserAgent when allowed', (t) => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  ;(provider as any).passGatewayRequestHeaders = ['user-agent']

  const headers = provider.determineRequestHeaders('param-ua', {
    'user-agent': 'header-ua',
  })

  t.is(headers['user-agent'], getUserAgent('param-ua'))
})

test('Provider determineRequestHeaders falls back to header user-agent', (t) => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  ;(provider as any).passGatewayRequestHeaders = ['user-agent']

  const headers = provider.determineRequestHeaders(undefined, {
    'user-agent': 'header-ua',
  })

  t.is(headers['user-agent'], getUserAgent('header-ua'))
})

test('Provider determineRequestHeaders falls back to config user-agent', (t) => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
    requestUserAgent: 'config-ua',
  })

  ;(provider as any).passGatewayRequestHeaders = ['user-agent']

  const headers = provider.determineRequestHeaders()

  t.is(headers['user-agent'], getUserAgent('config-ua'))
})

test('Provider determineRequestHeaders normalizes header casing', (t) => {
  const provider = new TestProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
  })

  ;(provider as any).passGatewayRequestHeaders = ['accept-language']

  const headers = provider.determineRequestHeaders(undefined, {
    'Accept-Language': 'en-GB',
  })

  t.deepEqual(headers, {
    'accept-language': 'en-GB',
    'user-agent': getUserAgent(),
  })
})
