import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { TtlCache } from '../cache/core.js'
import { SupportProviderEnum } from '../types.js'

import { buildWorkerManifest } from './build.js'
import { defineWorkerProject } from './config.js'
import { createSurgioRuntime } from './runtime.js'

import type { KvStore } from '../cache/types.js'
import type { WorkerManifest, WorkerProviderFormat } from './types.js'

class MemoryStore implements KvStore {
  readonly values = new Map<string, string>()
  closed = false

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
  async close() {
    this.closed = true
  }
}

const temporaryDirectories: string[] = []
afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((item) => fs.remove(item)),
  )
})

describe('Worker project', () => {
  test('rejects Node-only configuration at definition time', () => {
    expect(() =>
      defineWorkerProject({
        config: { artifacts: [], output: './dist' } as any,
        providers: {},
      }),
    ).toThrow('Node-only 字段 output')
  })

  test('builds an ESM manifest and renders all Worker template forms', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-worker-'))
    temporaryDirectories.push(directory)
    await fs.ensureDir(path.join(directory, 'template'))
    await fs.writeFile(
      path.join(directory, 'template', 'main.tpl'),
      `{% import "macro.tpl" as helpers %}{% include "partial.tpl" %}\n{{ helpers.label("ok") }} {{ getNodeNames(nodeList) }}\n{{ remoteSnippets.rules.main("Proxy") }}`,
    )
    await fs.writeFile(
      path.join(directory, 'template', 'macro.tpl'),
      '{% macro label(value) %}[{{ value }}]{% endmacro %}',
    )
    await fs.writeFile(
      path.join(directory, 'template', 'partial.tpl'),
      'artifact={{ artifactName }}',
    )
    await fs.writeJson(path.join(directory, 'template', 'base.json'), {
      version: 1,
    })
    const configFile = path.join(directory, 'surgio.worker.mjs')
    await fs.writeFile(
      configFile,
      `export default {
  templateDir: './template',
  providers: {
    demo: {
      type: 'custom',
      nodeList: [{ type: 'shadowsocks', nodeName: 'Demo', hostname: 'example.com', port: 443, method: 'aes-128-gcm', password: 'secret' }]
    }
  },
  config: {
    urlBase: 'https://example.com/',
    remoteSnippets: [{ name: 'rules', url: 'https://rules.example/list' }],
    artifacts: [
      { name: 'main', provider: 'demo', template: 'main' },
      { name: 'inline', provider: 'demo', template: '', templateString: 'inline={{ getNodeNames(nodeList) }}' },
      { name: 'json', provider: 'demo', template: 'base', templateType: 'json', extendTemplate(input, context) { return { ...input, nodes: context.nodeList.length } } }
    ]
  }
}`,
    )
    const outfile = path.join(directory, '.surgio', 'worker-manifest.mjs')
    await buildWorkerManifest({ configFile, outfile })
    const imported = await import(
      `${pathToFileURL(outfile).href}?test=${Date.now()}`
    )
    const store = new MemoryStore()
    const cache = new TtlCache({ store })
    const fetchMock = vi.fn(async () => new Response('DOMAIN,example.com'))
    const runtime = createSurgioRuntime(imported.default as WorkerManifest, {
      cache,
      fetch: fetchMock,
      network: { artifactCacheTtl: 60_000 },
    })

    const main = await runtime.renderArtifact('main')
    expect(main.body).toContain('artifact=main\n[ok] Demo')
    expect(main.body).toContain('DOMAIN,example.com,Proxy')
    expect(main.subscriptionUserInfoMap).toEqual({})
    expect((await runtime.renderArtifact('inline')).body).toBe('inline=Demo')
    expect(JSON.parse((await runtime.renderArtifact('json')).body)).toEqual({
      version: 1,
      nodes: 1,
    })
    expect(
      (await runtime.renderProviders({ providers: 'demo' })).body,
    ).toContain('proxies:')
    const formats: WorkerProviderFormat[] = [
      'clash',
      'clash-provider',
      'loon',
      'quantumultx',
      'shadowsocks',
      'shadowsocks-json',
      'shadowsocksr',
      'singbox',
      'surfboard',
      'surge',
      'v2rayn',
    ]
    for (const format of formats) {
      expect(
        (await runtime.renderProviders({ providers: 'demo', format })).body,
      ).toBeTypeOf('string')
    }
    expect(runtime.listArtifacts()).toHaveLength(3)
    expect(runtime.listProviders()).toEqual(['demo'])
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await runtime.close()
    expect(store.closed).toBe(true)
  })

  test('uses the injected logger while parsing Provider responses', async () => {
    const cache = new TtlCache({ store: new MemoryStore() })
    const warn = vi.fn()
    const runtime = createSurgioRuntime(
      {
        surgioVersion: 'test',
        config: { artifacts: [] },
        providers: {
          demo: {
            type: SupportProviderEnum.Clash,
            url: 'https://provider.example/list',
          },
        },
        templates: {},
        rawTemplates: {},
        jsonTemplates: {},
        artifactTemplates: {},
      },
      {
        cache,
        fetch: async () =>
          new Response('proxies:\n  - name: unsupported\n    type: unknown'),
        logger: { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() },
      },
    )

    await runtime.renderProviders({ providers: 'demo', format: 'clash' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown'))
  })

  test('fails the build when an artifact references missing inputs', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'surgio-worker-'))
    temporaryDirectories.push(directory)
    await fs.ensureDir(path.join(directory, 'template'))
    const configFile = path.join(directory, 'surgio.worker.mjs')
    await fs.writeFile(
      configFile,
      `export default { providers: {}, config: { artifacts: [{ name: 'bad', provider: 'missing', template: 'missing' }] } }`,
    )
    await expect(buildWorkerManifest({ configFile })).rejects.toThrow(
      '未注册的 Provider missing',
    )
  })
})
