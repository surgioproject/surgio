import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'

import { TtlCache } from '../cache/core.js'
import { loadSurgioProject } from '../project/node.js'

import { createNodeSurgioRuntime } from './node.js'

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
      expect.stringContaining('不支持为 sing-box 生成 snell'),
    )
    await runtime.close()
  })
})
