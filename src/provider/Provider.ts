import { createLogger } from '@surgio/logger'

import { CACHE_KEYS } from '../constant'
import {
  ProviderConfig,
  SupportProviderEnum,
  PossibleNodeConfigType,
  SubscriptionUserinfo,
} from '../types'
import {
  RedisCache,
  SubsciptionCacheItem,
  SubscriptionCache,
} from '../utils/cache'
import { getConfig } from '../config'
import { getProviderCacheMaxage } from '../utils/env-flag'
import httpClient, { getUserAgent } from '../utils/http-client'
import { msToSeconds, toMD5, parseSubscriptionUserInfo } from '../utils'
import { ProviderValidator } from '../validators'
import { GetNodeListFunction, GetSubscriptionUserInfoFunction } from './types'

const logger = createLogger({
  service: 'surgio:Provider',
})

export default abstract class Provider {
  public readonly type: SupportProviderEnum
  public readonly config: ProviderConfig

  // 是否支持在订阅中获取用户流量信息
  public supportGetSubscriptionUserInfo: boolean

  protected constructor(public name: string, config: ProviderConfig) {
    const result = ProviderValidator.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw result.error
    }

    this.supportGetSubscriptionUserInfo = false
    this.config = result.data as ProviderConfig
    this.type = result.data.type
  }

  static async requestCacheableResource(
    url: string,
    options: {
      requestUserAgent?: string
    } = {},
  ): Promise<SubsciptionCacheItem> {
    const cacheType = getConfig()?.cache?.type || 'default'
    const cacheKey = `${CACHE_KEYS.Provider}:${toMD5(
      getUserAgent(options.requestUserAgent || '') + url,
    )}`
    const requestResource = async () => {
      const headers = {}

      if (options.requestUserAgent) {
        headers['user-agent'] = getUserAgent(options.requestUserAgent)
      }

      const res = await httpClient.get(url, {
        responseType: 'text',
        headers,
      })
      const subsciptionCacheItem: SubsciptionCacheItem = {
        body: res.body,
      }

      if (res.headers['subscription-userinfo']) {
        subsciptionCacheItem.subscriptionUserinfo = parseSubscriptionUserInfo(
          res.headers['subscription-userinfo'] as string,
        )
        logger.debug(
          '%s received subscription userinfo - raw: %s | parsed: %j',
          url,
          res.headers['subscription-userinfo'],
          subsciptionCacheItem.subscriptionUserinfo,
        )
      }

      return subsciptionCacheItem
    }

    if (cacheType === 'default') {
      return SubscriptionCache.has(cacheKey)
        ? (SubscriptionCache.get(cacheKey) as SubsciptionCacheItem)
        : await (async () => {
            const subsciptionCacheItem = await requestResource()
            SubscriptionCache.set(cacheKey, subsciptionCacheItem)
            return subsciptionCacheItem
          })()
    } else {
      const redisCache = new RedisCache()
      const cachedValue = await redisCache.getCache<SubsciptionCacheItem>(
        cacheKey,
      )

      return cachedValue
        ? cachedValue
        : await (async () => {
            const subsciptionCacheItem = await requestResource()
            await redisCache.setCache(cacheKey, subsciptionCacheItem, {
              ttl: msToSeconds(getProviderCacheMaxage()),
            })
            return subsciptionCacheItem
          })()
    }
  }

  public get nextPort(): number {
    if (this.config.startPort) {
      return this.config.startPort++
    }
    return 0
  }

  // istanbul ignore next
  public getSubscriptionUserInfo: GetSubscriptionUserInfoFunction =
    async () => {
      throw new Error('此 Provider 不支持该功能')
    }

  // istanbul ignore next
  public getNodeList: GetNodeListFunction = () => {
    return Promise.resolve([])
  }
}
