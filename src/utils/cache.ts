import ms from 'ms'
import { caching, MemoryCache, MemoryStore } from 'cache-manager'
import {
  redisInsStore,
  RedisCache,
  RedisStore,
} from 'cache-manager-ioredis-yet'
import { getConfig } from '../config'

import redis from '../redis'

type CacheType = MemoryCache | RedisCache
type StoreType = MemoryStore | RedisStore

export class UnifiedCache {
  #type: 'redis' | 'default' | undefined
  #backend: Promise<CacheType> | undefined

  async prepare(): Promise<CacheType> {
    if (!this.#type) {
      this.#type = getConfig()?.cache?.type || 'default'
    }

    if (this.#backend) {
      return this.#backend
    } else {
      switch (this.#type) {
        case 'redis':
          this.#backend = caching(redisInsStore(redis.getRedis()))
          break
        default:
          this.#backend = caching('memory', {
            ttl: ms('1d'),
          })
      }
      return this.#backend
    }
  }

  async getType() {
    await this.prepare()
    return this.#type as 'redis' | 'default'
  }

  async getBackend() {
    return this.prepare()
  }

  get: CacheType['get'] = async (...args) => {
    const cache = await this.prepare()
    return cache.get(...args)
  }

  set: CacheType['set'] = async (...args) => {
    const cache = await this.prepare()
    return cache.set(...args)
  }

  del: CacheType['del'] = async (...args) => {
    const cache = await this.prepare()
    return cache.del(...args)
  }

  reset: CacheType['reset'] = async (...args) => {
    const cache = await this.prepare()
    return cache.reset(...args)
  }

  keys: StoreType['keys'] = async (...args) => {
    const cache = await this.prepare()
    return cache.store.keys(...args)
  }

  mset: StoreType['mset'] = async (...args) => {
    const cache = await this.prepare()
    return cache.store.mset(...args)
  }

  mget: StoreType['mget'] = async (...args) => {
    const cache = await this.prepare()
    return cache.store.mget(...args)
  }

  mdel: StoreType['mdel'] = async (...args) => {
    const cache = await this.prepare()
    return cache.store.mdel(...args)
  }

  async has(key: string): Promise<boolean> {
    await this.prepare()

    if (this.#type === 'redis') {
      const keys = await this.keys()
      return keys.includes(key)
    } else {
      const redisClient = redis.getRedis()
      const value = await redisClient.exists(key)
      return value === 1
    }
  }
}

export const unifiedCache = new UnifiedCache()

// istanbul ignore next
export const cleanCaches = async () => {
  await unifiedCache.reset()
}
