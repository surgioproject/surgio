import { beforeEach, expect, test, vi } from 'vitest'

import { testKvStoreContract } from '../../../test/helpers/kv-store-contract.js'
import {
  CloudflareKvStore,
  type CloudflareKvNamespace,
} from '../stores/cloudflare-kv.js'
import { UpstashKvStore, type UpstashRedisClient } from '../stores/upstash.js'

class UpstashClientFake implements UpstashRedisClient {
  readonly values = new Map<string, string>()
  readonly setCalls: unknown[][] = []

  async get(key: string): Promise<unknown> {
    return this.values.get(key)
  }

  async set(
    key: string,
    value: string,
    options?: { pxat?: number },
  ): Promise<unknown> {
    this.setCalls.push([key, value, options])
    this.values.set(key, value)
    return undefined
  }

  async del(...keys: string[]): Promise<unknown> {
    keys.forEach((key) => this.values.delete(key))
    return undefined
  }

  async scan(
    cursor: number,
    options: { match: string },
  ): Promise<[number, string[]]> {
    const prefix = options.match.slice(0, -1)
    const keys = [...this.values.keys()].filter((key) => key.startsWith(prefix))
    const next = cursor + 1
    return [next >= keys.length ? 0 : next, keys.slice(cursor, next)]
  }
}

class CloudflareBindingFake implements CloudflareKvNamespace {
  readonly values = new Map<string, string>()
  readonly putCalls: Array<{
    key: string
    value: string
    options?: { expiration?: number }
  }> = []

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null
  }

  async put(
    key: string,
    value: string,
    options?: { expiration?: number },
  ): Promise<void> {
    this.putCalls.push({ key, value, options })
    this.values.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key)
  }

  async list(options?: { prefix?: string; cursor?: string }): Promise<{
    keys: Array<{ name: string }>
    list_complete: boolean
    cursor?: string
  }> {
    const keys = [...this.values.keys()].filter((key) =>
      key.startsWith(options?.prefix ?? ''),
    )
    const index = Number(options?.cursor ?? 0)
    const next = index + 1
    return {
      keys: keys.slice(index, next).map((name) => ({ name })),
      list_complete: next >= keys.length,
      ...(next < keys.length ? { cursor: String(next) } : {}),
    }
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})

testKvStoreContract('Upstash', () => {
  const client = new UpstashClientFake()
  return {
    primary: new UpstashKvStore('https://unused', 'token', {
      namespace: 'primary',
      client,
    }),
    isolated: new UpstashKvStore('https://unused', 'token', {
      namespace: 'isolated',
      client,
    }),
  }
})

testKvStoreContract('Cloudflare KV', () => {
  const binding = new CloudflareBindingFake()
  return {
    primary: new CloudflareKvStore(binding, { namespace: 'primary' }),
    isolated: new CloudflareKvStore(binding, { namespace: 'isolated' }),
  }
})

test('Upstash store uses a namespace, PXAT, and cursor scans', async () => {
  const client = new UpstashClientFake()
  const store = new UpstashKvStore('https://unused', 'token', {
    namespace: 'test',
    client,
  })

  await store.put('key', 'value', { expiresAt: 1234 })
  await store.put('second', 'value')
  expect(client.setCalls[0]).toEqual(['test:key', 'value', { pxat: 1234 }])

  const keys: string[] = []
  for await (const key of store.list()) keys.push(key)
  expect(keys.sort()).toEqual(['key', 'second'])
})

test('Upstash store loads and creates its client on first use only', async () => {
  const client = new UpstashClientFake()
  const createClient = vi.fn(async () => client)
  const store = new UpstashKvStore('https://unused', 'token', { createClient })

  await store.close()
  expect(createClient).not.toHaveBeenCalled()

  await Promise.all([store.put('one', 'value'), store.put('two', 'value')])
  expect(createClient).toHaveBeenCalledTimes(1)
})

test('Cloudflare store rounds expiration up to its minimum and paginates', async () => {
  const binding = new CloudflareBindingFake()
  const store = new CloudflareKvStore(binding, { namespace: 'test' })

  await store.put('one', 'value', { expiresAt: Date.now() + 1000 })
  await store.put('two', 'value', { expiresAt: Date.now() + 120_000 })
  binding.values.set('other:key', 'isolated')

  expect(binding.putCalls[0].options?.expiration).toBe(
    Math.ceil(Date.now() / 1000) + 60,
  )
  expect(binding.putCalls[1].options?.expiration).toBe(
    Math.ceil((Date.now() + 120_000) / 1000),
  )

  const keys: string[] = []
  for await (const key of store.list()) keys.push(key)
  expect(keys).toEqual(['one', 'two'])
})
