import assert from 'assert'
import { z } from 'zod'

import {
  SubscriptionUserinfo,
  TrojanNodeConfig,
  TrojanProviderConfig,
} from '../types'
import { fromBase64, SurgioError } from '../utils'
import relayableUrl from '../utils/relayable-url'
import { parseTrojanUri } from '../utils/trojan'

import Provider from './Provider'
import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetNodeListV2Function,
  GetNodeListV2Result,
  GetSubscriptionUserInfoFunction,
} from './types'

export default class TrojanProvider extends Provider {
  readonly #originalUrl: string
  public readonly udpRelay?: boolean
  public readonly tls13?: boolean

  constructor(name: string, config: TrojanProviderConfig) {
    super(name, config)

    const schema = z.object({
      url: z.string().url(),
      udpRelay: z.boolean().optional(),
      tls13: z.boolean().optional(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('TrojanProvider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.#originalUrl = result.data.url
    this.udpRelay = result.data.udpRelay
    this.tls13 = result.data.tls13
    this.supportGetSubscriptionUserInfo = true
  }

  // istanbul ignore next
  public get url(): string {
    return relayableUrl(this.#originalUrl, this.config.relayUrl)
  }

  public getSubscriptionUserInfo: GetSubscriptionUserInfoFunction = async (
    params = {},
  ) => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent || 'shadowrocket',
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    const { subscriptionUserinfo } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestHeaders,
      cacheKey,
    })

    if (subscriptionUserinfo) {
      return subscriptionUserinfo
    }
    return undefined
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<Array<TrojanNodeConfig>> => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent || 'shadowrocket',
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    const { nodeList } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestHeaders,
      cacheKey,
    })

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

  public getNodeListV2: GetNodeListV2Function = async (
    params = {},
  ): Promise<GetNodeListV2Result> => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent || 'shadowrocket',
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)

    const { nodeList, subscriptionUserinfo } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestHeaders,
      cacheKey,
    })

    if (this.config.hooks?.afterNodeListResponse) {
      const newList = await this.config.hooks.afterNodeListResponse(
        nodeList,
        params,
      )

      if (newList) {
        return { nodeList: newList, subscriptionUserinfo }
      }
    }

    return { nodeList, subscriptionUserinfo }
  }
}

/**
 * @see https://github.com/trojan-gfw/trojan-url/blob/master/trojan-url.py
 */
export const getTrojanSubscription = async ({
  url,
  udpRelay,
  tls13,
  requestHeaders,
  cacheKey,
}: {
  url: string
  udpRelay?: boolean
  tls13?: boolean
  requestHeaders: DefaultProviderRequestHeaders
  cacheKey: string
}): Promise<{
  readonly nodeList: Array<TrojanNodeConfig>
  readonly subscriptionUserinfo?: SubscriptionUserinfo
}> => {
  assert(url, '未指定订阅地址 url')

  const response = await Provider.requestCacheableResource(
    url,
    requestHeaders,
    cacheKey,
  )
  const config = fromBase64(response.body)
  const nodeList = config
    .split('\n')
    .filter((item) => !!item && item.startsWith('trojan://'))
    .map((item): TrojanNodeConfig => {
      const nodeConfig = parseTrojanUri(item)

      return {
        ...nodeConfig,
        udpRelay,
        tls13,
      }
    })

  return {
    nodeList,
    subscriptionUserinfo: response.subscriptionUserinfo,
  }
}
