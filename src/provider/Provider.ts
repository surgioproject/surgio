import { createLogger } from '@surgio/logger'
import _ from 'lodash'

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

import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetSubscriptionUserInfoFunction,
} from './types'

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
  // 是否传递 Gateway 请求的 Headers
  public passGatewayRequestHeaders: string[]

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
    this.passGatewayRequestHeaders =
      getConfig()?.gateway?.passRequestHeaders ?? []
  }

  static getResourceCacheKey(indentifier: string): string {
    return `${CACHE_KEYS.Provider}:${toMD5(indentifier)}`
  }

  static async requestCacheableResource(
    url: string,
    headers: DefaultProviderRequestHeaders,
    cacheKey: string = this.getResourceCacheKey(headers['user-agent'] + url),
  ): Promise<SubsciptionCacheItem> {
    const requestResource = async () => {
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
  ): string {
    const userAgent = this.passGatewayRequestUserAgent
      ? requestUserAgent || this.config.requestUserAgent
      : this.config.requestUserAgent

    return getUserAgent(userAgent)
  }

  public determineRequestHeaders(
    requestUserAgent?: string | undefined,
    requestHeaders?: Record<string, string> | undefined,
  ): DefaultProviderRequestHeaders {
    const userAgent = this.determineRequestUserAgent(requestUserAgent)
    const headers = { ...requestHeaders, 'user-agent': userAgent }
    return _.pick(
      headers,
      this.passGatewayRequestHeaders,
    ) as DefaultProviderRequestHeaders
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
