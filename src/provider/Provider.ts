import { createLogger } from '@surgio/logger'

import { CACHE_KEYS } from '../constant'
import {
  ProviderConfig,
  SubsciptionCacheItem,
  SupportProviderEnum,
} from '../types'
import { unifiedCache } from '../utils/cache'
import { getConfig } from '../config'
import { getProviderCacheMaxage } from '../utils/env-flag'
import httpClient, { getUserAgent } from '../utils/http-client'
import { toMD5, parseSubscriptionUserInfo, SurgioError } from '../utils'
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
  // 是否传递 Gateway 请求的 User-Agent
  public passGatewayRequestUserAgent: boolean

  protected constructor(public name: string, config: ProviderConfig) {
    const result = ProviderValidator.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('Provider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.supportGetSubscriptionUserInfo = false
    this.config = result.data as ProviderConfig
    this.type = result.data.type
    this.passGatewayRequestUserAgent =
      getConfig()?.gateway?.passRequestUserAgent ?? false
  }

  static async requestCacheableResource(
    url: string,
    options: {
      requestUserAgent?: string
    } = {},
  ): Promise<SubsciptionCacheItem> {
    const cacheKey = `${CACHE_KEYS.Provider}:${toMD5(
      getUserAgent(options.requestUserAgent) + url,
    )}`
    const requestResource = async () => {
      const headers: Record<string, string> = {}

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

    const cachedValue = await unifiedCache.get<SubsciptionCacheItem>(cacheKey)

    return cachedValue
      ? cachedValue
      : await (async () => {
          const subsciptionCacheItem = await requestResource()
          await unifiedCache.set(
            cacheKey,
            subsciptionCacheItem,
            getProviderCacheMaxage(),
          )
          return subsciptionCacheItem
        })()
  }

  public determineRequestUserAgent(
    requestUserAgent?: string | undefined,
  ): string | undefined {
    return this.passGatewayRequestUserAgent
      ? requestUserAgent || this.config.requestUserAgent
      : this.config.requestUserAgent
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
