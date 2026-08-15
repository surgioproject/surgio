import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import * as config from '../../config.js'
import * as utils from '../remote-snippet.js'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(config, 'getConfig').mockReturnValue({} as any)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

test('loadRemoteSnippetList', async () => {
  const snippets = [
    {
      url: 'http://example.com/telegram.list',
      name: 'telegram',
    },
    {
      url: 'http://example.com/netflix.list',
      name: 'netflix',
    },
    {
      url: 'http://example.com/test-ruleset.list',
      name: 'test',
    },
    {
      url: 'http://example.com/ForeignMedia.list',
      name: 'ForeignMedia',
    },
    {
      url: 'http://example.com/surgio-snippet.tpl',
      name: 'surgioSnippet',
      surgioSnippet: true,
    },
  ]
  const remoteSnippetList = await utils.loadRemoteSnippetList(snippets)

  // with cache
  await utils.loadRemoteSnippetList(snippets)

  expect(remoteSnippetList[0].main('Proxy')).toMatchSnapshot()
  expect(remoteSnippetList[1].main('Proxy')).toMatchSnapshot()
  expect(remoteSnippetList[2].main('Proxy')).toMatchSnapshot()
  expect(remoteSnippetList[3].main('Proxy')).toMatchSnapshot()
  expect(remoteSnippetList[4].main('PROXY', 'DIRECT')).toMatchSnapshot()

  expect(() => {
    remoteSnippetList[0].main()
  }).toThrow('必须为片段指定一个策略')

  expect(() => {
    remoteSnippetList[4].main('PROXY')
  }).toThrow('Surgio 片段参数不足，缺少 rule2')

  expect(() => {
    // @ts-ignore
    remoteSnippetList[4].main(true, false)
  }).toThrow('Surgio 片段参数 rule1 不为字符串')
})

test('loadRemoteSnippetList in now', async () => {
  vi.stubEnv('NOW_REGION', 'dev_1')

  const remoteSnippetList = await utils.loadRemoteSnippetList([
    {
      url: 'http://example.com/telegram.list?v=1',
      name: 'telegram',
    },
    {
      url: 'http://example.com/netflix.list?v=1',
      name: 'netflix',
    },
    {
      url: 'http://example.com/test-ruleset.list?v=1',
      name: 'test',
    },
    {
      url: 'http://example.com/ForeignMedia.list?v=1',
      name: 'ForeignMedia',
    },
  ])

  expect(remoteSnippetList[0].main('Proxy')).toMatchSnapshot()
  expect(remoteSnippetList[1].main('Proxy')).toMatchSnapshot()
  expect(remoteSnippetList[2].main('Proxy')).toMatchSnapshot()
  expect(remoteSnippetList[3].main('Proxy')).toMatchSnapshot()
})

test('loadRemoteSnippetList with error', async () => {
  expect.assertions(1)
  try {
    await utils.loadRemoteSnippetList([
      {
        url: 'http://example.com/error',
        name: 'error',
      },
    ])
  } catch (err) {
    expect(err instanceof Error).toBeTruthy()
  }
})

test('addProxyToSurgeRuleSet', () => {
  expect(
    utils.addProxyToSurgeRuleSet(
      'AND,((SRC-IP,192.168.1.110), (DOMAIN, example.com))',
      'Proxy',
    ),
  ).toBe('AND,((SRC-IP,192.168.1.110), (DOMAIN, example.com)),Proxy')
  expect(
    utils.addProxyToSurgeRuleSet('IP-CIDR,192.168.0.0/16,no-resolve', 'Proxy'),
  ).toBe('IP-CIDR,192.168.0.0/16,Proxy,no-resolve')
  expect(
    utils.addProxyToSurgeRuleSet(
      'IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128,no-resolve',
      'Proxy',
    ),
  ).toBe('IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128,Proxy,no-resolve')
  expect(utils.addProxyToSurgeRuleSet('IP-CIDR,192.168.0.0/16', 'Proxy')).toBe(
    'IP-CIDR,192.168.0.0/16,Proxy',
  )
  expect(
    utils.addProxyToSurgeRuleSet(
      'IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128',
      'Proxy',
    ),
  ).toBe('IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128,Proxy')
  expect(utils.addProxyToSurgeRuleSet('GEOIP,US,no-resolve', 'Proxy')).toBe(
    'GEOIP,US,Proxy,no-resolve',
  )
  expect(
    utils.addProxyToSurgeRuleSet('URL-REGEX,^http://google.com', 'Proxy'),
  ).toBe('URL-REGEX,^http://google.com,Proxy')
  expect(
    utils.addProxyToSurgeRuleSet(
      'DOMAIN,www.apple.com # comment comment',
      'Proxy',
    ),
  ).toBe('DOMAIN,www.apple.com,Proxy')
})

test('parseMacro', () => {
  expect(() => {
    utils.parseMacro(`
{% macro wrong_function_name(rule1, rule2) %}
{% endmacro %}
    `)
  }).toThrow('该片段不包含可用的宏')
  expect(() => {
    utils.parseMacro(`
{% macro main %}
{% endmacro %}
    `)
  }).toThrow('该片段不包含可用的宏')

  expect(() => {
    utils.parseMacro('')
  }).toThrow('该片段不包含可用的宏')
  expect(() => {
    utils.parseMacro(`
{% macro main(rule1, rule2) %}
{% endmacro %}
    `)
  }).not.toThrow()
})
