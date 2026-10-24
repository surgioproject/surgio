import _ from 'lodash'

import {
  CACHE_KEYS,
  PASS_GATEWAY_REQUEST_HEADERS_WHITELIST,
} from '../constant/index.js'
import {
  ProviderConfig,
  SubsciptionCacheItem,
  SupportProviderEnum,
} from '../types.js'
import { getDefaultProviderRuntimeContext } from '../runtime/provider-context.js'
import { getRuntimeUserAgent } from '../runtime/user-agent.js'
import { parseSubscriptionUserInfoHeader } from '../runtime/subscription.js'
import { SurgioError } from '../utils/errors.js'
import { toMD5 } from '../utils/portable.js'
import { ProviderValidator } from '../validators/index.js'

import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetNodeListV2Function,
  GetSubscriptionUserInfoFunction,
} from './types.js'

import type {
  ProviderRuntimeContext,
  RuntimeHeaders,
} from '../runtime/types.js'

export default abstract class Provider {
  public readonly type: SupportProviderEnum
  public readonly config: ProviderConfig

  // Whether the provider supports getting subscription user info
  public supportGetSubscriptionUserInfo: boolean = false

  // Headers that will be passed to the upstream server
  private passGatewayRequestHeaders: string[]
  #runtime?: ProviderRuntimeContext

  protected constructor(
    public name: string,
    config: ProviderConfig,
  ) {
    const result = ProviderValidator.safeParse(config)

    /* istanbul ignore next -- @preserve */
    if (!result.success) {
      throw new SurgioError('Provider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.config = result.data satisfies ProviderConfig
    this.type = result.data.type
    this.passGatewayRequestHeaders = []
    for (const header of PASS_GATEWAY_REQUEST_HEADERS_WHITELIST) {
      if (!this.passGatewayRequestHeaders.includes(header)) {
        this.passGatewayRequestHeaders.push(header)
      }
    }
  }

  public useRuntime(context: ProviderRuntimeContext): this {
    this.#runtime = context
    this.passGatewayRequestHeaders = (
      context.config.gateway?.passRequestHeaders ?? []
    ).map((header) => header.toLowerCase())
    if (context.config.gateway?.passRequestUserAgent) {
      this.passGatewayRequestHeaders.push('user-agent')
    }
    for (const header of PASS_GATEWAY_REQUEST_HEADERS_WHITELIST) {
      if (!this.passGatewayRequestHeaders.includes(header)) {
        this.passGatewayRequestHeaders.push(header)
      }
    }
    return this
  }

  protected get runtime(): ProviderRuntimeContext {
    return this.#runtime ?? getDefaultProviderRuntimeContext()
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
    runtime: ProviderRuntimeContext = getDefaultProviderRuntimeContext(),
  ): Promise<SubsciptionCacheItem> {
    runtime.logger.debug(
      'requestCacheableResource: %s %j %s',
      url,
      headers,
      cacheKey,
    )

    const requestResource = async () => {
      const res = await runtime.httpClient.get(url, {
        headers,
      })
      const subsciptionCacheItem: SubsciptionCacheItem = {
        body: res.body,
      }

      if (res.headers['subscription-userinfo']) {
        subsciptionCacheItem.subscriptionUserInfo =
          parseSubscriptionUserInfoHeader(
            res.headers['subscription-userinfo'] as string,
          )
        runtime.logger.debug(
          '%s received subscription userinfo - raw: %s | parsed: %j',
          url,
          res.headers['subscription-userinfo'],
          subsciptionCacheItem.subscriptionUserInfo,
        )
      }

      return subsciptionCacheItem
    }

    const cachedValue = await runtime.cache.get<SubsciptionCacheItem>(cacheKey)

    if (cachedValue) {
      runtime.logger.debug(
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
            await runtime.cache.set(
              cacheKey,
              subsciptionCacheItem,
              runtime.providerCacheTtl,
            )
            runtime.logger.debug(
              'requestCacheableResource: %s %j %s: not cached',
              url,
              headers,
              cacheKey,
            )
            return subsciptionCacheItem
          })()
    } catch (error) {
      runtime.logger.error(
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
   * Determine the HTTP headers to use for provider requests.
   * Filters headers based on the gateway's passRequestHeaders configuration.
   *
   * @param requestUserAgent - Optional User-Agent from the gateway request
   * @param requestHeaders - Optional custom headers from the gateway request
   * @returns Filtered headers object with required user-agent
   *
   * @remarks
   * - Always includes the user-agent header
   * - If user doesn't want to pass the user-agent header from the gateway request, a
   *   default user-agent from the provider config will be used
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
    requestHeaders?: RuntimeHeaders | undefined,
  ): DefaultProviderRequestHeaders {
    const passRequestUserAgent =
      this.passGatewayRequestHeaders.includes('user-agent')
    const headerUserAgent = requestHeaders?.['user-agent']
    const userAgent = getRuntimeUserAgent(
      passRequestUserAgent
        ? requestUserAgent ||
            (Array.isArray(headerUserAgent)
              ? headerUserAgent[0]
              : headerUserAgent) ||
            this.config.requestUserAgent
        : this.config.requestUserAgent,
      this.runtime.version,
    )

    // Normalize incoming headers to lowercase keys for case-insensitive matching
    // Always exclude user-agent from the normalized headers
    const normalizedHeaders = requestHeaders
      ? Object.fromEntries(
          Object.entries(requestHeaders)
            .map(([k, v]) => [k.toLowerCase(), v])
            .filter(([k]) => k !== 'user-agent'),
        )
      : {}

    // Filter headers based on allowlist
    const filteredHeaders = _.pick(
      normalizedHeaders,
      this.passGatewayRequestHeaders,
    )

    return {
      ...filteredHeaders,
      'user-agent': userAgent,
    } as DefaultProviderRequestHeaders
  }

  /* istanbul ignore next -- @preserve */
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
