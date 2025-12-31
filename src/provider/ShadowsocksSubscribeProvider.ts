import assert from 'assert'
import { z } from 'zod'

import {
  ShadowsocksNodeConfig,
  ShadowsocksSubscribeProviderConfig,
  SubscriptionUserinfo,
} from '../types'
import { fromBase64, SurgioError } from '../utils'
import relayableUrl from '../utils/relayable-url'
import { parseSSUri } from '../utils/ss'

import Provider from './Provider'
import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetSubscriptionUserInfoFunction,
} from './types'

export default class ShadowsocksSubscribeProvider extends Provider {
  public readonly udpRelay?: boolean
  readonly #originalUrl: string

  constructor(name: string, config: ShadowsocksSubscribeProviderConfig) {
    super(name, config)

    const schema = z.object({
      url: z.string().url(),
      udpRelay: z.boolean().optional(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('ShadowsocksSubscribeProvider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.#originalUrl = result.data.url
    this.udpRelay = result.data.udpRelay
    this.supportGetSubscriptionUserInfo = true
  }

  // istanbul ignore next
  public get url(): string {
    return relayableUrl(this.#originalUrl, this.config.relayUrl)
  }

  public getSubscriptionUserInfo: GetSubscriptionUserInfoFunction = async (
    params = {},
  ) => {
    const requestHeaders = this.determineRequestHeaders(params.requestUserAgent)
    const cacheKey = Provider.getResourceCacheKey(
      requestHeaders['user-agent'] + this.url,
    )
    const { subscriptionUserinfo } = await getShadowsocksSubscription(
      this.url,
      requestHeaders,
      cacheKey,
      this.udpRelay,
    )

    if (subscriptionUserinfo) {
      return subscriptionUserinfo
    }
    return undefined
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<Array<ShadowsocksNodeConfig>> => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(
      requestHeaders['user-agent'] + this.url,
    )
    const { nodeList } = await getShadowsocksSubscription(
      this.url,
      requestHeaders,
      cacheKey,
      this.udpRelay,
    )

    if (this.config.hooks?.afterNodeListResponse) {
      const newList = await this.config.hooks.afterNodeListResponse(
        nodeList,
        params,
      )

      if (newList) {
        return newList
      }
    }

    return nodeList
  }
}

/**
 * @see https://shadowsocks.org/en/spec/SIP002-URI-Scheme.html
 */
export const getShadowsocksSubscription = async (
  url: string,
  requestHeaders: DefaultProviderRequestHeaders,
  cacheKey: string,
  udpRelay?: boolean,
): Promise<{
  readonly nodeList: Array<ShadowsocksNodeConfig>
  readonly subscriptionUserinfo?: SubscriptionUserinfo
}> => {
  assert(url, '未指定订阅地址 url')

  const response = await Provider.requestCacheableResource(
    url,
    requestHeaders,
    cacheKey,
  )
  const nodeList = fromBase64(response.body)
    .split('\n')
    .filter((item) => !!item && item.startsWith('ss://'))
    .map((item): ShadowsocksNodeConfig => {
      const nodeConfig = parseSSUri(item)

      if (udpRelay !== void 0) {
        ;(nodeConfig.udpRelay as boolean) = udpRelay
      }

      return nodeConfig
    })

  return {
    nodeList,
    subscriptionUserinfo: response.subscriptionUserinfo,
  }
}
