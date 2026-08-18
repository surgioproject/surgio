import assert from 'assert'
import { z } from 'zod/v3'
import { logger } from '@surgio/logger'

import {
  ShadowsocksrNodeConfig,
  ShadowsocksrSubscribeProviderConfig,
  SubscriptionUserinfo,
} from '../types.js'
import { SurgioError } from '../utils/errors.js'
import { fromBase64 } from '../utils/portable.js'
import relayableUrl from '../utils/relayable-url.js'
import { parseSubscriptionNode } from '../utils/subscription.js'
import { parseSSRUri } from '../utils/ssr.js'

import Provider from './Provider.js'
import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetNodeListV2Function,
  GetNodeListV2Result,
  GetSubscriptionUserInfoFunction,
} from './types.js'

import type { ProviderRuntimeContext } from '../runtime/types.js'

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

    /* istanbul ignore next -- @preserve */
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
    const { subscriptionUserInfo } = await getShadowsocksrSubscription(
      this.url,
      requestHeaders,
      cacheKey,
      this.udpRelay,
      this.runtime,
    )

    if (subscriptionUserInfo) {
      return subscriptionUserInfo
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
      this.runtime,
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

    const { nodeList, subscriptionUserInfo } =
      await getShadowsocksrSubscription(
        this.url,
        requestHeaders,
        cacheKey,
        this.udpRelay,
        this.runtime,
      )

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

export const getShadowsocksrSubscription = async (
  url: string,
  requestHeaders: DefaultProviderRequestHeaders,
  cacheKey: string,
  udpRelay?: boolean,
  runtime?: ProviderRuntimeContext,
): Promise<{
  readonly nodeList: Array<ShadowsocksrNodeConfig>
  readonly subscriptionUserInfo?: SubscriptionUserinfo
}> => {
  assert(url, '未指定订阅地址 url')
  const runtimeLogger = runtime?.logger ?? logger

  const response = await Provider.requestCacheableResource(
    url,
    requestHeaders,
    cacheKey,
    runtime,
  )
  const nodeList = fromBase64(response.body)
    .split('\n')
    .filter((item) => !!item && item.startsWith('ssr://'))
    .map<ShadowsocksrNodeConfig>((str) => {
      const nodeConfig = parseSSRUri(str, runtimeLogger)

      if (udpRelay !== void 0) {
        nodeConfig.udpRelay = udpRelay
      }

      return nodeConfig
    })

  if (
    !response.subscriptionUserInfo &&
    nodeList[0].nodeName.includes('剩余流量')
  ) {
    const dataNode = nodeList[0]
    const expireNode = nodeList[1]
    response.subscriptionUserInfo = parseSubscriptionNode(
      dataNode.nodeName,
      expireNode.nodeName,
    )
    runtimeLogger.debug(
      '%s received subscription node - raw: %s %s | parsed: %j',
      url,
      dataNode.nodeName,
      expireNode.nodeName,
      response.subscriptionUserInfo,
    )
  }

  return {
    nodeList,
    subscriptionUserInfo: response.subscriptionUserInfo,
  }
}
