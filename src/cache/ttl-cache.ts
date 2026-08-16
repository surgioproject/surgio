import { defaultDeserialize, defaultSerialize } from '@keyv/serialize'

import type { CacheType, KvStore, PreparedKvStore } from './types.js'

interface CacheEntry<T> {
  value: T
  expires?: number
}

export interface TtlCacheOptions {
  createStore?: () => PreparedKvStore | Promise<PreparedKvStore>
  store?: KvStore
  type?: CacheType
}

export class TtlCache {
  readonly #createStore?: TtlCacheOptions['createStore']
  readonly #inFlight = new Map<string, Promise<unknown>>()
  #prepared: PreparedKvStore | undefined
  #preparing: Promise<PreparedKvStore> | undefined

  constructor(options: TtlCacheOptions = {}) {
    this.#createStore = options.createStore

    if (options.store) {
      this.#prepared = {
        store: options.store,
        type: options.type ?? 'custom',
      }
    }
  }

  useStore(store: KvStore, type: CacheType = 'custom'): void {
    if (this.#prepared || this.#preparing) {
      throw new Error('Cache store has already been initialized')
    }

    this.#prepared = { store, type }
  }

  async prepare(): Promise<PreparedKvStore> {
    if (this.#prepared) {
      return this.#prepared
    }

    if (this.#preparing) {
      return this.#preparing
    }

    if (!this.#createStore) {
      throw new Error('Cache store is not configured')
    }

    this.#preparing = Promise.resolve(this.#createStore()).then((prepared) => {
      this.#prepared = prepared
      return prepared
    })

    try {
      return await this.#preparing
    } finally {
      this.#preparing = undefined
    }
  }

  async getType(): Promise<CacheType> {
    return (await this.prepare()).type
  }

  async get<T>(key: string): Promise<T | undefined> {
    const { store } = await this.prepare()
    const serialized = await store.get(key)

    if (serialized === undefined) {
      return undefined
    }

    let entry: CacheEntry<T> | undefined
    try {
      entry = defaultDeserialize<CacheEntry<T>>(serialized)
    } catch {
      await this.#deleteBestEffort(store, key)
      return undefined
    }

    if (!entry || !Object.hasOwn(entry, 'value')) {
      await this.#deleteBestEffort(store, key)
      return undefined
    }

    if (entry.expires !== undefined && entry.expires <= Date.now()) {
      await this.#deleteBestEffort(store, key)
      return undefined
    }

    return entry.value
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const { store } = await this.prepare()
    const normalizedTtl = ttl === 0 ? undefined : ttl
    const expires =
      normalizedTtl === undefined ? undefined : Date.now() + normalizedTtl

    if (expires !== undefined && expires <= Date.now()) {
      await store.delete(key)
      return
    }

    const serialized = defaultSerialize({ value, expires })
    await store.put(key, serialized, { expiresAt: expires })
  }

  async del(key: string): Promise<void> {
    const { store } = await this.prepare()
    await store.delete(key)
  }

  async reset(): Promise<void> {
    const { store } = await this.prepare()
    const keys: string[] = []

    for await (const key of store.list()) {
      keys.push(key)
    }

    await Promise.all(keys.map((key) => store.delete(key)))
  }

  async wrap<T>(
    key: string,
    fn: () => T | Promise<T>,
    ttl?: number | ((value: T) => number),
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const existing = this.#inFlight.get(key)
    if (existing) {
      return existing as Promise<T>
    }

    const pending = Promise.resolve(fn()).then(async (value) => {
      const resolvedTtl = typeof ttl === 'function' ? ttl(value) : ttl
      await this.set(key, value, resolvedTtl)
      return value
    })

    this.#inFlight.set(key, pending)
    try {
      return await pending
    } finally {
      this.#inFlight.delete(key)
    }
  }

  async keys(): Promise<string[]> {
    const { store } = await this.prepare()
    const keys: string[] = []

    for await (const key of store.list()) {
      if ((await this.get(key)) !== undefined) {
        keys.push(key)
      }
    }

    return keys
  }

  async mset(entries: [string, unknown][], ttl?: number): Promise<void> {
    await Promise.all(entries.map(([key, value]) => this.set(key, value, ttl)))
  }

  async mget<T>(...keys: string[]): Promise<Array<T | undefined>> {
    return Promise.all(keys.map((key) => this.get<T>(key)))
  }

  async mdel(...keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.del(key)))
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined
  }

  async close(): Promise<void> {
    if (this.#preparing) {
      await this.#preparing
    }

    if (this.#prepared) {
      await this.#prepared.store.close()
    }
  }

  async #deleteBestEffort(store: KvStore, key: string): Promise<void> {
    try {
      await store.delete(key)
    } catch {
      // Logical expiry and corrupt-record handling must still behave as a miss.
    }
  }
}
