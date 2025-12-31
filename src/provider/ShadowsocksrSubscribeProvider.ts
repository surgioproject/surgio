import assert from 'assert'
import { createLogger } from '@surgio/logger'
import { z } from 'zod'

import {
  ShadowsocksrNodeConfig,
  ShadowsocksrSubscribeProviderConfig,
  SubscriptionUserinfo,
} from '../types'
import { fromBase64, SurgioError } from '../utils'
import relayableUrl from '../utils/relayable-url'
import { parseSubscriptionNode } from '../utils/subscription'
import { parseSSRUri } from '../utils/ssr'

import Provider from './Provider'
import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetNodeListV2Function,
  GetNodeListV2Result,
  GetSubscriptionUserInfoFunction,
} from './types'

const logger = createLogger({
  service: 'surgio:ShadowsocksrSubscribeProvider',
})

export default class ShadowsocksrSubscribeProvider extends Provider {
  public readonly udpRelay?: boolean
  readonly #originalUrl: string

  constructor(name: string, config: ShadowsocksrSubscribeProviderConfig) {
    super(name, config)

    const schema = z.object({
      url: z.string().url(),
      udpRelay: z.boolean().optional(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('ShadowsocksrSubscribeProvider 配置校验失败', {
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
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    const { subscriptionUserinfo } = await getShadowsocksrSubscription(
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
  ): Promise<Array<ShadowsocksrNodeConfig>> => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    const { nodeList } = await getShadowsocksrSubscription(
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

  public getNodeListV2: GetNodeListV2Function = async (
    params = {},
  ): Promise<GetNodeListV2Result> => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)

    const { nodeList, subscriptionUserinfo } = await getShadowsocksrSubscription(
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
        return { nodeList: newList, subscriptionUserinfo }
      }
    }

    return { nodeList, subscriptionUserinfo }
  }
}

export const getShadowsocksrSubscription = async (
  url: string,
  requestHeaders: DefaultProviderRequestHeaders,
  cacheKey: string,
  udpRelay?: boolean,
): Promise<{
  readonly nodeList: Array<ShadowsocksrNodeConfig>
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
    .filter((item) => !!item && item.startsWith('ssr://'))
    .map<ShadowsocksrNodeConfig>((str) => {
      const nodeConfig = parseSSRUri(str)

      if (udpRelay !== void 0) {
        ;(nodeConfig.udpRelay as boolean) = udpRelay
      }

      return nodeConfig
    })

  if (
    !response.subscriptionUserinfo &&
    nodeList[0].nodeName.includes('剩余流量')
  ) {
    const dataNode = nodeList[0]
    const expireNode = nodeList[1]
    response.subscriptionUserinfo = parseSubscriptionNode(
      dataNode.nodeName,
      expireNode.nodeName,
    )
    logger.debug(
      '%s received subscription node - raw: %s %s | parsed: %j',
      url,
      dataNode.nodeName,
      expireNode.nodeName,
      response.subscriptionUserinfo,
    )
  }

  return {
    nodeList,
    subscriptionUserinfo: response.subscriptionUserinfo,
  }
}
