import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'

import { TtlCache } from '../cache/core.js'
import { loadSurgioProject } from '../project/node.js'
import { SupportProviderEnum } from '../types.js'
import { createSurgioRuntime } from '../worker/runtime.js'

import { createNodeSurgioRuntime } from './node.js'
import * as interpreter from './snippet-interpreter.js'

import type { KvStore } from '../cache/types.js'

const fixture = path.resolve(import.meta.dirname, '../../test/fixture/plain')

class MemoryStore implements KvStore {
  readonly values = new Map<string, string>()

  async get(key: string) {
    return this.values.get(key)
  }
  async put(key: string, value: string) {
    this.values.set(key, value)
  }
  async delete(key: string) {
    this.values.delete(key)
  }
  async *list(prefix = '') {
    for (const key of this.values.keys()) if (key.startsWith(prefix)) yield key
  }
  async close() {}
}

describe('Node Surgio runtime', () => {
  test('coalesces remote snippet downloads and reuses each parsed macro', async () => {
    const project = await loadSurgioProject(fixture)
    const parse = vi.spyOn(interpreter, 'parseRestrictedSnippet')
    const fetch = vi.fn(
      async () =>
        new Response(
          '{% macro main(proxy) %}DOMAIN,example.com,{{ proxy }}{% endmacro %}',
        ),
    )
    const info = vi.fn()
    const runtime = createNodeSurgioRuntime(
      {
        ...project,
        providers: {
          demo: { type: SupportProviderEnum.Custom, nodeList: [] },
        },
        config: {
          ...project.config,
          artifacts: ['first', 'second'].map((name) => ({
            name,
            provider: 'demo',
            template: '',
            templateType: 'default' as const,
            templateString:
              "{{ remoteSnippets.rules.main('PROXY') }}\n{{ remoteSnippets.rules.main('DIRECT') }}",
          })),
          remoteSnippets: [
            {
              name: 'rules',
              url: 'https://example.com/macro.tpl',
              surgioSnippet: true,
            },
          ],
        },
      },
      {
        cache: new TtlCache({ store: new MemoryStore() }),
        fetch,
        logger: { debug: vi.fn(), info, warn: vi.fn(), error: vi.fn() },
      },
    )

    try {
      const results = await Promise.all([
        runtime.renderArtifact('first'),
        runtime.renderArtifact('second'),
      ])
      for (const result of results) {
        expect(result.body).toBe(
          'DOMAIN,example.com,PROXY\nDOMAIN,example.com,DIRECT',
        )
      }
      expect(fetch).toHaveBeenCalledOnce()
      expect(info).toHaveBeenCalledOnce()
      expect(parse).toHaveBeenCalledTimes(2)
    } finally {
      parse.mockRestore()
      await runtime.close()
    }
  })

  test.each([
    SupportProviderEnum.Clash,
    SupportProviderEnum.ShadowsocksSubscribe,
    SupportProviderEnum.ShadowsocksrSubscribe,
    SupportProviderEnum.V2rayNSubscribe,
    SupportProviderEnum.Trojan,
  ] as const)(
    'Node and Worker expose the URL of %s subscriptions',
    async (type) => {
      const project = await loadSurgioProject(fixture)
      const providers = {
        Oixcloud: { type, url: 'https://provider.example/subscription' },
        custom: { type: SupportProviderEnum.Custom, nodeList: [] },
      } as const
      const options = () => ({
        cache: new TtlCache({ store: new MemoryStore() }),
      })
      const runtimes = [
        createNodeSurgioRuntime({ ...project, providers }, options()),
        createSurgioRuntime(
          {
            surgioVersion: 'test',
            config: { artifacts: [] },
            providers,
            templates: {},
            rawTemplates: {},
            jsonTemplates: {},
            artifactTemplates: {},
          },
          options(),
        ),
      ]

      try {
        for (const runtime of runtimes) {
          expect(await runtime.getProviderInfo('Oixcloud')).toEqual({
            name: 'Oixcloud',
            type,
            url: 'https://provider.example/subscription',
            supportGetSubscriptionUserInfo:
              type !== SupportProviderEnum.V2rayNSubscribe,
          })
          expect(await runtime.getProviderInfo('custom')).toEqual({
            name: 'custom',
            type: SupportProviderEnum.Custom,
            supportGetSubscriptionUserInfo: false,
          })
          expect(await runtime.getProviderInfo('missing')).toBeUndefined()
        }
      } finally {
        await Promise.all(runtimes.map((runtime) => runtime.close()))
      }
    },
  )

  test('renders through the shared runtime interface', async () => {
    const project = await loadSurgioProject(fixture)
    const runtime = createNodeSurgioRuntime(project)
    const artifact = runtime.listArtifacts()[0]
    const result = await runtime.renderArtifact(artifact.name)

    expect(result.artifact.name).toBe(artifact.name)
    expect(result.body.length).toBeGreaterThan(0)
    expect(runtime.listProviders().length).toBeGreaterThan(0)
    expect(runtime.getGatewayConfig()?.accessToken).toBe('abcd')
    await runtime.close()
  })

  test('渲染缓存的条目数由配置决定，不随请求变化', async () => {
    const project = await loadSurgioProject(fixture)
    const store = new MemoryStore()
    const debug = vi.fn()
    const runtime = createNodeSurgioRuntime(project, {
      cache: new TtlCache({ store }),
      logger: { debug, info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    })
    const artifact = runtime.listArtifacts()[0]
    const renderedKeys = () =>
      [...store.values.keys()].filter((key) =>
        key.startsWith('rendered-artifact:'),
      )

    await runtime.renderArtifact(artifact.name, {
      downloadUrl: 'https://example.com/get-artifact/demo?a=1&b=2',
      getNodeListParams: {
        requestHeaders: { 'X-Surge-Unlocked-Features': 'vif' },
      },
    })
    await runtime.renderArtifact(artifact.name, {
      downloadUrl: 'https://example.com/get-artifact/demo?b=2&a=1',
      getNodeListParams: {
        requestHeaders: { 'x-surge-unlocked-features': 'vif' },
      },
    })

    expect(renderedKeys()).toHaveLength(1)

    await runtime.renderArtifact(artifact.name, {
      customParams: { foo: 'bar' },
    })
    await runtime.renderArtifact(artifact.name, {
      customParams: { foo: 'baz' },
    })

    expect(renderedKeys()).toHaveLength(1)
    expect(debug).toHaveBeenCalledWith(
      'Artifact %s 跳过渲染缓存：%s',
      artifact.name,
      'customParams.foo 的取值不可枚举',
    )
    await runtime.close()
  })

  test('routes formatter warnings to the injected logger', async () => {
    const project = await loadSurgioProject(fixture)
    const warn = vi.fn()
    const runtime = createNodeSurgioRuntime(project, {
      cache: new TtlCache({ store: new MemoryStore() }),
      logger: { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() },
    })

    await runtime.renderProviders({ providers: 'custom', format: 'singbox' })

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('sing-box 的 snell 节点仅支持 v4、v5 和 v6'),
    )
    await runtime.close()
  })
})
