import { createLogger } from '@surgio/logger'
import assert from 'assert'
import { z } from 'zod'

import {
  ShadowsocksrNodeConfig,
  ShadowsocksrSubscribeProviderConfig,
  SubscriptionUserinfo,
} from '../types'
import { fromBase64 } from '../utils'
import relayableUrl from '../utils/relayable-url'
import { parseSubscriptionNode } from '../utils/subscription'
import { parseSSRUri } from '../utils/ssr'
import Provider from './Provider'
import { GetNodeListFunction, GetSubscriptionUserInfoFunction } from './types'

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
      throw result.error
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
    const requestUserAgent = this.determineRequestUserAgent(
      params.requestUserAgent,
    )
    const { subscriptionUserinfo } = await getShadowsocksrSubscription(
      this.url,
      this.udpRelay,
      requestUserAgent,
    )

    if (subscriptionUserinfo) {
      return subscriptionUserinfo
    }
    return undefined
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<Array<ShadowsocksrNodeConfig>> => {
    const requestUserAgent = this.determineRequestUserAgent(
      params.requestUserAgent,
    )
    const { nodeList } = await getShadowsocksrSubscription(
      this.url,
      this.udpRelay,
      requestUserAgent,
    )

    if (this.config.hooks?.afterFetchNodeList) {
      const newList = await this.config.hooks.afterFetchNodeList(
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

export const getShadowsocksrSubscription = async (
  url: string,
  udpRelay?: boolean,
  requestUserAgent?: string,
): Promise<{
  readonly nodeList: Array<ShadowsocksrNodeConfig>
  readonly subscriptionUserinfo?: SubscriptionUserinfo
}> => {
  assert(url, '未指定订阅地址 url')

  const response = await Provider.requestCacheableResource(url, {
    requestUserAgent,
  })
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
