import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import * as config from '../../config.js'
import * as interpreter from '../../runtime/snippet-interpreter.js'
import * as utils from '../remote-snippet.js'

import type { TtlCache } from '../../cache/core.js'

const snippetConfig = {
  name: 'injected',
  url: 'https://example.com/injected.list',
}

const createRuntime = (body = 'DOMAIN,example.com', cached?: string) => {
  const cache = {
    async get<T>(_key: string): Promise<T | undefined> {
      return cached as T | undefined
    },
    set: vi.fn<TtlCache['set']>().mockResolvedValue(undefined),
  }
  return {
    cache,
    cacheGet: vi.spyOn(cache, 'get'),
    httpClient: {
      get: vi.fn().mockResolvedValue({ body, headers: {}, statusCode: 200 }),
    },
  }
}

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

  expect(remoteSnippetList[0].main()).toBe(remoteSnippetList[0].text)

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

test.each(['DOMAIN,cached.example.com', ''])(
  'uses cached text %j even when long-lived caching is disabled',
  async (text) => {
    const runtime = createRuntime(undefined, text)
    const [snippet] = await utils.loadRemoteSnippetList(
      [snippetConfig],
      false,
      runtime,
    )
    expect(snippet.text).toBe(text)
    expect(snippet.main()).toBe(text)
    expect(runtime.httpClient.get).not.toHaveBeenCalled()
    expect(runtime.cache.set).not.toHaveBeenCalled()
  },
)

test.each([
  [true, 1234, 1234],
  [true, 0, 0],
  [false, 1234, 60_000],
])(
  'preserves cache TTL with cacheSnippet=%s and cacheTtl=%s',
  async (cacheSnippet, cacheTtl, expectedTtl) => {
    const runtime = { ...createRuntime(), cacheTtl }
    const [snippet] = await utils.loadRemoteSnippetList(
      [snippetConfig],
      cacheSnippet,
      runtime,
    )
    expect(runtime.httpClient.get).toHaveBeenCalledExactlyOnceWith(
      snippetConfig.url,
    )
    expect(runtime.cache.set).toHaveBeenCalledExactlyOnceWith(
      runtime.cacheGet.mock.calls[0][0],
      snippet.text,
      expectedTtl,
    )
  },
)

test('propagates cache write errors', async () => {
  const runtime = createRuntime()
  const error = new Error('cache write failed')
  runtime.cache.set.mockRejectedValue(error)
  await expect(
    utils.loadRemoteSnippetList([snippetConfig], true, runtime),
  ).rejects.toBe(error)
})

test('parses a macro lazily once and renders fresh arguments on each call', async () => {
  const parse = vi.spyOn(interpreter, 'parseRestrictedSnippet')
  const runtime = createRuntime(
    '{% macro main(proxy) %}DOMAIN,example.com,{{ proxy }}{% endmacro %}',
  )
  const [snippet] = await utils.loadRemoteSnippetList(
    [{ ...snippetConfig, surgioSnippet: true }],
    true,
    runtime,
  )
  expect(parse).not.toHaveBeenCalled()
  expect(snippet.main('PROXY')).toBe('DOMAIN,example.com,PROXY')
  expect(() => snippet.main()).toThrow('Surgio 片段参数不足，缺少 proxy')
  expect(snippet.main('DIRECT')).toBe('DOMAIN,example.com,DIRECT')
  expect(parse).toHaveBeenCalledTimes(1)

  runtime.httpClient.get.mockResolvedValue({
    body: '{% macro main(proxy) %}DOMAIN,new.example.com,{{ proxy }}{% endmacro %}',
    headers: {},
    statusCode: 200,
  })
  const [updated] = await utils.loadRemoteSnippetList(
    [{ ...snippetConfig, surgioSnippet: true }],
    true,
    runtime,
  )
  expect(updated.main('REJECT')).toBe('DOMAIN,new.example.com,REJECT')
  expect(snippet.main('DIRECT')).toBe('DOMAIN,example.com,DIRECT')
  expect(parse).toHaveBeenCalledTimes(2)
})

test('defers invalid macro errors until main is called', async () => {
  const runtime = createRuntime('{% macro wrong(proxy) %}{% endmacro %}')
  const [snippet] = await utils.loadRemoteSnippetList(
    [{ ...snippetConfig, surgioSnippet: true }],
    true,
    runtime,
  )
  expect(() => snippet.main('PROXY')).toThrow()
  expect(() => snippet.main('DIRECT')).toThrow()
})
