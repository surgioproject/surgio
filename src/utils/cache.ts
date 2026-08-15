import { createKeyv as createRedisKeyv } from '@keyv/redis'
import { createKeyv as createMemoryKeyv } from 'cacheable'
import { Cache, createCache } from 'cache-manager'
import ms from 'ms'

import { getConfig } from '../config'

export class UnifiedCache {
  #type: 'redis' | 'default' | undefined
  #backend: Cache | undefined

  async prepare(): Promise<Cache> {
    if (!this.#type) {
      this.#type = getConfig()?.cache?.type || 'default'
    }

    if (this.#backend) {
      return this.#backend
    }

    switch (this.#type) {
      case 'redis': {
        const redisUrl = getConfig()?.cache?.redisUrl
        if (!redisUrl) {
          throw new Error('Redis cache URL is not configured')
        }
        this.#backend = createCache({
          stores: [createRedisKeyv(redisUrl)],
        })
        break
      }
      default:
        this.#backend = createCache({
          stores: [createMemoryKeyv({ ttl: ms('1d') })],
        })
    }

    return this.#backend
  }

  async getType() {
    await this.prepare()
    return this.#type as 'redis' | 'default'
  }

  async getBackend() {
    return this.prepare()
  }

  async get<T>(key: string): Promise<T | undefined> {
    const cache = await this.prepare()
    return cache.get<T>(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const cache = await this.prepare()
    await cache.set(key, value, ttl)
  }

  async del(key: string): Promise<void> {
    const cache = await this.prepare()
    await cache.del(key)
  }

  async reset(): Promise<void> {
    const cache = await this.prepare()
    await cache.clear()
  }

  async wrap<T>(
    key: string,
    fn: () => T | Promise<T>,
    ttl?: number | ((value: T) => number),
  ): Promise<T> {
    const cache = await this.prepare()
    return cache.wrap(key, fn, ttl)
  }

  async keys(): Promise<string[]> {
    const cache = await this.prepare()
    const iterator = cache.stores[0]?.iterator
    if (!iterator) {
      return []
    }

    const keys: string[] = []
    for await (const [key] of iterator(undefined)) {
      keys.push(key)
    }
    return keys
  }

  async mset(entries: [string, unknown][], ttl?: number): Promise<void> {
    const cache = await this.prepare()
    await cache.mset(
      entries.map(([key, value]) => ({
        key,
        value,
        ttl,
      })),
    )
  }

  async mget<T>(...keys: string[]): Promise<Array<T | undefined>> {
    const cache = await this.prepare()
    return cache.mget<T>(keys)
  }

  async mdel(...keys: string[]): Promise<void> {
    const cache = await this.prepare()
    await cache.mdel(keys)
  }

  async has(key: string): Promise<boolean> {
    const cache = await this.prepare()
    return cache.stores[0]?.has(key) ?? false
  }
}

export const unifiedCache = new UnifiedCache()

/* istanbul ignore next -- @preserve */
export const cleanCaches = async () => {
  await unifiedCache.reset()
}
