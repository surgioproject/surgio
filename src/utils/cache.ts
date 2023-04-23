import Redis from 'ioredis'
import NodeCache from 'node-cache'

import { SubscriptionUserinfo } from '../types'
import { getProviderCacheMaxage } from './env-flag'
import { msToSeconds } from './index'
import redis from '../redis'

export interface SubsciptionCacheItem {
  readonly body: string
  subscriptionUserinfo?: SubscriptionUserinfo
}

export const ConfigCache = new NodeCache({
  stdTTL: msToSeconds(getProviderCacheMaxage()),
  maxKeys: 300,
  useClones: false,
})

export const SubscriptionCache = new NodeCache({
  stdTTL: msToSeconds(getProviderCacheMaxage()),
  maxKeys: 300,
  useClones: false,
})

export class RedisCache {
  private redisClient: Redis

  constructor(public namespace?: string) {
    this.redisClient = redis.getRedis()
  }

  getCacheKey(key: string) {
    return this.namespace ? `${this.namespace}:${key}` : key
  }

  setCache = async (
    key: string,
    value: unknown,
    { ttl }: { ttl?: number } = {},
  ) => {
    const storeValue: string = JSON.stringify(value)

    if (typeof ttl === 'undefined') {
      await this.redisClient.set(this.getCacheKey(key), storeValue)
    } else {
      await this.redisClient.set(this.getCacheKey(key), storeValue, 'EX', ttl)
    }
  }

  getCache = async <T>(key: string): Promise<T | undefined> => {
    const value = await this.redisClient.get(this.getCacheKey(key))

    if (!value) {
      return undefined
    }

    return JSON.parse(value) as T
  }

  hasCache = async (key: string): Promise<boolean> => {
    const value = await this.redisClient.exists(this.getCacheKey(key))

    return !!value
  }

  deleteCache = async (key: string) => {
    await this.redisClient.del(this.getCacheKey(key))
  }
}

// istanbul ignore next
export const cleanCaches = async () => {
  ConfigCache.flushAll()
  SubscriptionCache.flushAll()

  if (redis.hasRedis()) {
    await redis.cleanCache()
  }
}
