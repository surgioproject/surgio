import { z } from 'zod/v3'

import {
  NodeTypeEnum,
  SubscriptionUserinfo,
  TrojanNodeConfig,
  TrojanProviderConfig,
} from '../types.js'
import { SurgioError } from '../utils/errors.js'
import relayableUrl from '../utils/relayable-url.js'

import Provider from './Provider.js'
import { getV2rayNSubscriptionResult } from './V2rayNSubscribeProvider.js'
import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetNodeListV2Function,
  GetNodeListV2Result,
  GetSubscriptionUserInfoFunction,
} from './types.js'

import type { ProviderRuntimeContext } from '../runtime/types.js'

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

    /* istanbul ignore next -- @preserve */
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

    if (!this.config.requestUserAgent) {
      this.config.requestUserAgent = 'shadowrocket'
    }
  }

  /* istanbul ignore next -- @preserve */
  public get url(): string {
    return relayableUrl(this.#originalUrl, this.config.relayUrl)
  }

  public getSubscriptionUserInfo: GetSubscriptionUserInfoFunction = async (
    params = {},
  ) => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    const { subscriptionUserInfo } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestHeaders,
      cacheKey,
      runtime: this.runtime,
    })

    if (subscriptionUserInfo) {
      return subscriptionUserInfo
    }
    return undefined
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<Array<TrojanNodeConfig>> => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    const { nodeList } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestHeaders,
      cacheKey,
      runtime: this.runtime,
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
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)

    const { nodeList, subscriptionUserInfo } = await getTrojanSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestHeaders,
      cacheKey,
      runtime: this.runtime,
    })

    if (this.config.hooks?.afterNodeListResponse) {
      const newList = await this.config.hooks.afterNodeListResponse(
        nodeList,
        params,
      )

      if (newList) {
        return { nodeList: newList, subscriptionUserInfo }
      }
    }

    return { nodeList, subscriptionUserInfo }
  }
}

export const getTrojanSubscription = async ({
  url,
  udpRelay,
  tls13,
  requestHeaders,
  cacheKey,
  runtime,
}: {
  url: string
  udpRelay?: boolean
  tls13?: boolean
  requestHeaders: DefaultProviderRequestHeaders
  cacheKey: string
  runtime?: ProviderRuntimeContext
}): Promise<{
  readonly nodeList: Array<TrojanNodeConfig>
  readonly subscriptionUserInfo?: SubscriptionUserinfo
}> => {
  const result = await getV2rayNSubscriptionResult({
    url,
    allowedNodeTypes: new Set([NodeTypeEnum.Trojan]),
    udpRelay,
    tls13,
    requestHeaders,
    cacheKey,
    runtime,
  })

  return {
    nodeList: result.nodeList.filter(
      (node): node is TrojanNodeConfig => node.type === NodeTypeEnum.Trojan,
    ),
    subscriptionUserInfo: result.subscriptionUserInfo,
  }
}
