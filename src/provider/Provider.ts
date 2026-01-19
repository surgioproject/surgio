import { createLogger } from '@surgio/logger'
import _ from 'lodash'
import { IncomingHttpHeaders } from 'http'

import { CACHE_KEYS, PASS_GATEWAY_REQUEST_HEADERS_WHITELIST } from '../constant'
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
  GetNodeListV2Function,
  GetSubscriptionUserInfoFunction,
} from './types'

const logger = createLogger({
  service: 'surgio:Provider',
})

export default abstract class Provider {
  public readonly type: SupportProviderEnum
  public readonly config: ProviderConfig

  // Whether the provider supports getting subscription user info
  public supportGetSubscriptionUserInfo: boolean = false

  // Headers that will be passed to the upstream server
  private passGatewayRequestHeaders: string[]

  protected constructor(public name: string, config: ProviderConfig) {
    const result = ProviderValidator.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('Provider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.config = result.data satisfies ProviderConfig
    this.type = result.data.type
    this.passGatewayRequestHeaders = (
      getConfig()?.gateway?.passRequestHeaders ?? []
    ).map((header) => header.toLowerCase())

    if (getConfig()?.gateway?.passRequestUserAgent) {
      if (!this.passGatewayRequestHeaders.includes('user-agent')) {
        this.passGatewayRequestHeaders.push('user-agent')
      }
    }

    for (const header of PASS_GATEWAY_REQUEST_HEADERS_WHITELIST) {
      if (!this.passGatewayRequestHeaders.includes(header)) {
        this.passGatewayRequestHeaders.push(header)
      }
    }
  }

  /**
   * Generate a cache key for a provider resource based on an identifier.
   *
   * @param identifier - A unique identifier for the resource (typically user-agent + URL)
   * @returns MD5-hashed cache key
   */
  static getResourceCacheKey(
    ...identifiers: (string | Record<string, unknown>)[]
  ): string {
    const identifier: string[] = []

    for (const identifierItem of identifiers) {
      if (typeof identifierItem === 'string') {
        identifier.push(identifierItem)
      } else {
        identifier.push(JSON.stringify(identifierItem))
      }
    }

    return `${CACHE_KEYS.Provider}:${toMD5(identifier.join(''))}`
  }

  /**
   * Fetch a cacheable resource from a URL with specified headers.
   * Returns cached response if available within the cache TTL.
   *
   * @param url - The subscription URL to fetch
   * @param headers - HTTP headers to include in the request
   * @param cacheKey - Cache key for storing/retrieving the response (auto-generated if not provided)
   * @returns Subscription data including body and optional user info
   */
  static async requestCacheableResource(
    url: string,
    headers: DefaultProviderRequestHeaders,
    cacheKey: string = this.getResourceCacheKey(headers, url),
  ): Promise<SubsciptionCacheItem> {
    logger.debug('requestCacheableResource: %s %j %s', url, headers, cacheKey)

    const requestResource = async () => {
      const res = await httpClient.get(url, {
        responseType: 'text',
        headers,
      })
      const subsciptionCacheItem: SubsciptionCacheItem = {
        body: res.body,
      }

      if (res.headers['subscription-userinfo']) {
        subsciptionCacheItem.subscriptionUserInfo = parseSubscriptionUserInfo(
          res.headers['subscription-userinfo'] as string,
        )
        logger.debug(
          '%s received subscription userinfo - raw: %s | parsed: %j',
          url,
          res.headers['subscription-userinfo'],
          subsciptionCacheItem.subscriptionUserInfo,
        )
      }

      return subsciptionCacheItem
    }

    const cachedValue = await unifiedCache.get<SubsciptionCacheItem>(cacheKey)

    if (cachedValue) {
      logger.debug(
        'requestCacheableResource: %s %j %s: cached',
        url,
        headers,
        cacheKey,
      )
    }

    try {
      return cachedValue
        ? cachedValue
        : await (async () => {
            const subsciptionCacheItem = await requestResource()
            await unifiedCache.set(
              cacheKey,
              subsciptionCacheItem,
              getProviderCacheMaxage(),
            )
            logger.debug(
              'requestCacheableResource: %s %j %s: not cached',
              url,
              headers,
              cacheKey,
            )
            return subsciptionCacheItem
          })()
    } catch (error) {
      logger.error(
        'requestCacheableResource: %s %j %s',
        url,
        headers,
        cacheKey,
        error,
      )
      throw error
    }
  }

  /**
   * Determine the User-Agent string to use for provider requests.
   * Respects the gateway's passRequestUserAgent configuration.
   *
   * @param requestUserAgent - Optional User-Agent from the gateway request
   * @returns Normalized User-Agent string
   *
   * @remarks
   * - If passGatewayRequestHeaders includes 'user-agent', uses the gateway's User-Agent (if provided)
   * - Falls back to the provider's configured requestUserAgent
   * - Normalizes the User-Agent through getUserAgent() utility
   */
  public determineRequestUserAgent(
    requestUserAgent?: string | undefined,
  ): string {
    const userAgent =
      this.passGatewayRequestHeaders.includes('user-agent') && requestUserAgent
        ? requestUserAgent
        : this.config.requestUserAgent

    return getUserAgent(userAgent)
  }

  /**
   * Determine the HTTP headers to use for provider requests.
   * Filters headers based on the gateway's passRequestHeaders configuration.
   *
   * @param requestUserAgent - Optional User-Agent from the gateway request
   * @param requestHeaders - Optional custom headers from the gateway request
   * @returns Filtered headers object with required user-agent
   *
   * @remarks
   * - Always includes the user-agent header (determined by determineRequestUserAgent)
   * - The requestUserAgent parameter takes priority over requestHeaders['user-agent']
   * - Filters additional headers based on passGatewayRequestHeaders allowlist
   * - If passGatewayRequestHeaders is empty, only user-agent is returned
   * - The returned object always contains 'user-agent' regardless of configuration
   *
   * @example
   * ```typescript
   * // With passGatewayRequestHeaders: ['accept-language']
   * const headers = provider.determineRequestHeaders(
   *   'custom-ua',
   *   { 'accept-language': 'en-US', 'x-custom': 'value' }
   * )
   * // Returns: { 'user-agent': 'custom-ua', 'accept-language': 'en-US' }
   * // Note: 'x-custom' is filtered out
   * ```
   */
  public determineRequestHeaders(
    requestUserAgent?: string | undefined,
    requestHeaders?: IncomingHttpHeaders | undefined,
  ): DefaultProviderRequestHeaders {
    const userAgent = this.determineRequestUserAgent(requestUserAgent)

    // Normalize incoming headers to lowercase keys for case-insensitive matching
    const normalizedHeaders = requestHeaders
      ? Object.fromEntries(
          Object.entries(requestHeaders).map(([k, v]) => [k.toLowerCase(), v]),
        )
      : {}

    // Merge headers with normalized user-agent
    // requestUserAgent takes priority over requestHeaders['user-agent']
    const mergedHeaders = { ...normalizedHeaders, 'user-agent': userAgent }

    // Filter headers based on allowlist
    const filteredHeaders = _.pick(
      mergedHeaders,
      this.passGatewayRequestHeaders,
    )

    return {
      ...filteredHeaders,
    } as DefaultProviderRequestHeaders
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

  abstract getNodeList: GetNodeListFunction

  /**
   * Get node list and subscription user info in a single call.
   * This is the recommended method over separate getNodeList and getSubscriptionUserInfo calls.
   *
   * Providers must implement this to efficiently fetch both data when they come from the same source.
   */
  abstract getNodeListV2: GetNodeListV2Function
}
