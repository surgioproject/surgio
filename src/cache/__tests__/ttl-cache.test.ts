import { Buffer } from 'node:buffer'
import { beforeEach, expect, test, vi } from 'vitest'

import { TtlCache } from '../ttl-cache.js'

import type { KvStore, KvStorePutOptions } from '../types.js'

class MemoryKvStore implements KvStore {
  readonly values = new Map<string, string>()
  readonly expirations = new Map<string, number | undefined>()
  closed = false
  failDelete = false

  async get(key: string): Promise<string | undefined> {
    return this.values.get(key)
  }

  async put(
    key: string,
    value: string,
    options?: KvStorePutOptions,
  ): Promise<void> {
    this.values.set(key, value)
    this.expirations.set(key, options?.expiresAt)
  }

  async delete(key: string): Promise<void> {
    if (this.failDelete) {
      throw new Error('delete failed')
    }
    this.values.delete(key)
    this.expirations.delete(key)
  }

  async *list(prefix = ''): AsyncIterable<string> {
    for (const key of this.values.keys()) {
      if (key.startsWith(prefix)) {
        yield key
      }
    }
  }

  async close(): Promise<void> {
    this.closed = true
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})

test('stores serializable values and enforces logical TTL', async () => {
  const store = new MemoryKvStore()
  const cache = new TtlCache({ store, type: 'custom' })

  await cache.set(
    'object',
    { buffer: Buffer.from('value'), enabled: false },
    1000,
  )
  expect(await cache.get('object')).toEqual({
    buffer: Buffer.from('value'),
    enabled: false,
  })
  expect(store.expirations.get('object')).toBe(Date.now() + 1000)

  vi.advanceTimersByTime(1000)
  expect(await cache.get('object')).toBeUndefined()
  expect(store.values.has('object')).toBe(false)
})

test('treats zero TTL as persistent and negative TTL as expired', async () => {
  const store = new MemoryKvStore()
  const cache = new TtlCache({ store })

  await cache.set('persistent', 'value', 0)
  await cache.set('expired', 'value', -1)

  expect(await cache.get('persistent')).toBe('value')
  expect(store.expirations.get('persistent')).toBeUndefined()
  expect(await cache.get('expired')).toBeUndefined()
})

test('removes malformed records and preserves falsy values', async () => {
  const store = new MemoryKvStore()
  const cache = new TtlCache({ store })
  store.values.set('broken', 'not-json')

  await cache.set('empty', '')
  await cache.set('false', false)

  expect(await cache.get('broken')).toBeUndefined()
  expect(store.values.has('broken')).toBe(false)
  expect(await cache.get('empty')).toBe('')
  expect(await cache.get('false')).toBe(false)
})

test('treats corrupt and expired records as misses when cleanup fails', async () => {
  const store = new MemoryKvStore()
  const cache = new TtlCache({ store })

  store.values.set('broken', 'not-json')
  await cache.set('expired', 'value', 1)
  store.failDelete = true
  vi.advanceTimersByTime(1)

  await expect(cache.get('broken')).resolves.toBeUndefined()
  await expect(cache.get('expired')).resolves.toBeUndefined()
})

test('implements bulk operations, keys, reset, and close through the store', async () => {
  const store = new MemoryKvStore()
  const cache = new TtlCache({ store })

  await cache.mset([
    ['one', 1],
    ['two', 2],
  ])
  expect(await cache.mget<number>('one', 'two', 'missing')).toEqual([
    1,
    2,
    undefined,
  ])
  expect((await cache.keys()).sort()).toEqual(['one', 'two'])
  expect(await cache.has('one')).toBe(true)

  await cache.mdel('one', 'two')
  expect(await cache.keys()).toEqual([])

  await cache.set('reset-me', true)
  await cache.reset()
  expect(await cache.get('reset-me')).toBeUndefined()

  await cache.close()
  expect(store.closed).toBe(true)
})

test('coalesces concurrent wrap calls and supports a TTL function', async () => {
  const cache = new TtlCache({ store: new MemoryKvStore() })
  let resolveValue: ((value: string) => void) | undefined
  const loader = vi.fn(
    () =>
      new Promise<string>((resolve) => {
        resolveValue = resolve
      }),
  )

  const first = cache.wrap('key', loader, (value) => value.length * 100)
  const second = cache.wrap('key', loader, (value) => value.length * 100)
  await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1))
  resolveValue?.('value')

  await expect(Promise.all([first, second])).resolves.toEqual([
    'value',
    'value',
  ])
  expect(await cache.wrap('key', () => 'other')).toBe('value')
})

test('only accepts an injected store before initialization', async () => {
  const cache = new TtlCache({
    createStore: () => ({ store: new MemoryKvStore(), type: 'filesystem' }),
  })

  expect(await cache.getType()).toBe('filesystem')
  expect(() => cache.useStore(new MemoryKvStore())).toThrow(
    'Cache store has already been initialized',
  )
})

test('accepts a synchronous store injection before first access', async () => {
  const cache = new TtlCache()
  const store = new MemoryKvStore()

  cache.useStore(store)
  await cache.set('key', 'value')

  expect(await cache.get('key')).toBe('value')
  expect(await cache.getType()).toBe('custom')
})
