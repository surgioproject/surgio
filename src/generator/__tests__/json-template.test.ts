import { expect, test, vi } from 'vitest'

import { createArtifactRenderContext } from '../../runtime/artifact.js'
import { addProxyToRuleSet } from '../../runtime/ruleset.js'
import {
  extendOutbounds,
  extendRoute,
  createExtendFunction,
  combineExtendFunctions,
} from '../json-extend.js'

import type { Logger } from '@surgio/logger'
import type { ArtifactConfig } from '../../types.js'

test('extendOutbounds - extend string', () => {
  const extend = extendOutbounds('new-value')

  expect(
    extend({
      foo: 'foo',
    }),
  ).toEqual({
    foo: 'foo',
    outbounds: 'new-value',
  })
})

test('extendOutbounds - extend object', () => {
  const extend = extendOutbounds({
    bar: 'bar',
  })

  expect(
    extend({
      foo: 'foo',
    }),
  ).toEqual({
    foo: 'foo',
    outbounds: {
      bar: 'bar',
    },
  })
})

test('extendOutbounds - extend array', () => {
  const extendString = extendOutbounds('new-value')
  expect(
    extendString({
      foo: 'foo',
      outbounds: ['old-value'],
    }),
  ).toEqual({
    foo: 'foo',
    outbounds: ['old-value', 'new-value'],
  })

  const extendObject = extendOutbounds({
    bar: 'bar',
  })
  expect(
    extendObject({
      outbounds: [
        {
          foo: 'foo',
        },
      ],
    }),
  ).toEqual({
    outbounds: [
      {
        foo: 'foo',
      },
      {
        bar: 'bar',
      },
    ],
  })

  const extendArray = extendOutbounds(['new-value1', 'new-value2'])

  expect(extendArray({ outbounds: ['old-value'] })).toEqual({
    outbounds: ['old-value', 'new-value1', 'new-value2'],
  })
})

test('extendOutbounds - extend function that returns object', () => {
  const getUrl = vi.fn((path: string) => `https://example.com/${path}`)
  const extend = extendOutbounds((context) => ({
    url: context.getUrl('sub.json'),
  }))

  expect(extend({ foo: 'foo' }, { getUrl })).toEqual({
    foo: 'foo',
    outbounds: { url: 'https://example.com/sub.json' },
  })
  expect(getUrl).toHaveBeenCalledOnce()
})

test('extendRoute - append rules and override final', () => {
  const extend = extendRoute({
    rules: [{ domain_suffix: ['example.com'], outbound: 'proxy' }],
    final: 'proxy',
  })

  expect(
    extend({
      route: {
        rules: [{ domain: ['prefilled.com'], outbound: 'direct' }],
        final: 'direct',
      },
    }),
  ).toEqual({
    route: {
      rules: [
        { domain: ['prefilled.com'], outbound: 'direct' },
        { domain_suffix: ['example.com'], outbound: 'proxy' },
      ],
      final: 'proxy',
    },
  })
})

test('createExtendFunction - deep extend', () => {
  const extendFunction = createExtendFunction('foo.bar')
  const extend = extendFunction({
    bar: 'bar',
  })

  expect(
    extend({
      foo: {
        baz: 'baz',
      },
    }),
  ).toEqual({
    foo: {
      baz: 'baz',
      bar: {
        bar: 'bar',
      },
    },
  })
})

test('createExtendFunction - deep extend array', () => {
  const extendFunction = createExtendFunction('foo[0]')
  const extend = extendFunction({
    bar: 'bar',
  })

  expect(
    extend({
      foo: [
        {
          baz: 'baz',
        },
      ],
    }),
  ).toEqual({
    foo: [
      {
        baz: 'baz',
        bar: 'bar',
      },
    ],
  })
})

test('createExtendFunction - deep merge object', () => {
  const extendDNS = createExtendFunction('dns')
  const extend = extendDNS({
    nameserver: ['1.1.1.1'],
  })

  expect(
    extend({
      dns: {
        nameserver: ['1.0.0.1'],
        strategy: 'prefer_ipv6',
      },
    }),
  ).toEqual({
    dns: {
      nameserver: ['1.0.0.1', '1.1.1.1'],
      strategy: 'prefer_ipv6',
    },
  })
})

test('combineExtendFunctions', () => {
  const extend1 = createExtendFunction('foo')({ bar: 'bar' })
  const extend2 = createExtendFunction('baz')({ qux: 'qux' })

  const combined = combineExtendFunctions(extend1, extend2)

  expect(
    combined({
      original: 'original',
    }),
  ).toEqual({
    original: 'original',
    foo: {
      bar: 'bar',
    },
    baz: {
      qux: 'qux',
    },
  })
})

test('extendRoute with getSingboxRules - end to end', () => {
  const warn = vi.fn()
  const snippetText = 'DOMAIN-SUFFIX,example.com\nUSER-AGENT,SomeApp'
  const context = createArtifactRenderContext({
    artifact: { name: 'singbox.json', provider: 'demo' } as ArtifactConfig,
    config: {
      urlBase: 'https://example.com/',
      publicUrl: 'https://example.com/',
    } as any,
    nodeList: [],
    mainProvider: { config: {} } as any,
    customFilters: {},
    customParams: {},
    remoteSnippetList: [
      {
        name: 'x',
        url: 'https://example.com/x.list',
        text: snippetText,
        main: (policy?: string) => addProxyToRuleSet(snippetText, policy),
      },
    ],
    loadSnippet: () => {
      throw new Error('not used')
    },
    logger: { warn } as unknown as Logger,
  })
  const extendTemplate = extendRoute(({ getSingboxRules, remoteSnippets }) => ({
    rules: getSingboxRules(remoteSnippets.x.main('proxy')),
    final: 'proxy',
  }))

  expect(
    extendTemplate(
      {
        outbounds: [],
        route: {
          rules: [{ domain: ['prefilled.com'], outbound: 'direct' }],
          final: 'direct',
        },
      },
      context,
    ),
  ).toEqual({
    outbounds: [],
    route: {
      rules: [
        { domain: ['prefilled.com'], outbound: 'direct' },
        { domain_suffix: ['example.com'], outbound: 'proxy' },
      ],
      final: 'proxy',
    },
  })
  expect(warn).toHaveBeenCalledWith(
    'sing-box 不支持的规则已忽略：%s (%s)',
    'USER-AGENT,SomeApp,proxy',
    expect.stringContaining('USER-AGENT'),
  )
})

type RenderContextConfig = Parameters<
  typeof createArtifactRenderContext
>[0]['config']

const buildContext = (
  overrides: {
    gateway?: Partial<NonNullable<RenderContextConfig['gateway']>>
    accessToken?: string
  } = {},
) =>
  createArtifactRenderContext({
    artifact: { name: 'clash.yaml', provider: 'demo' } as ArtifactConfig,
    config: {
      urlBase: 'https://example.com/',
      publicUrl: 'https://example.com/',
      gateway: overrides.gateway,
    } as unknown as RenderContextConfig,
    nodeList: [],
    mainProvider: { config: {} } as any,
    customFilters: {},
    customParams: {},
    loadSnippet: () => {
      throw new Error('not used')
    },
    logger: { warn: vi.fn() } as unknown as Logger,
    accessToken: overrides.accessToken,
  })

test('渲染参数 accessToken 优先于配置 token', () => {
  const ctx = buildContext({
    gateway: { accessToken: 'admin', viewerToken: 'viewer' },
    accessToken: 'user-a',
  })

  expect(ctx.getDownloadUrl('a.conf')).toContain('access_token=user-a')
  expect(ctx.getUrl('/x')).toContain('access_token=user-a')
  expect(ctx.downloadUrl).toContain('access_token=user-a')
})

test('未传 accessToken 时保持 viewerToken ?? accessToken', () => {
  const ctx = buildContext({
    gateway: { accessToken: 'admin', viewerToken: 'viewer' },
  })

  expect(ctx.getDownloadUrl('a.conf')).toContain('access_token=viewer')
})

test('配置 authProvider 时 generate 使用 accessToken', () => {
  const ctx = buildContext({
    gateway: {
      auth: true,
      accessToken: 'admin',
      authProvider: async () => ({ success: false }),
    },
  })

  expect(ctx.getDownloadUrl('a.conf')).toContain('access_token=admin')
})
