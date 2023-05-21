import assert from 'assert'
import { z } from 'zod'

import {
  ShadowsocksNodeConfig,
  ShadowsocksSubscribeProviderConfig,
  SubscriptionUserinfo,
} from '../types'
import { fromBase64 } from '../utils'
import relayableUrl from '../utils/relayable-url'
import { parseSSUri } from '../utils/ss'
import Provider from './Provider'
import { GetNodeListFunction, GetSubscriptionUserInfoFunction } from './types'

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

  public getSubscriptionUserInfo: GetSubscriptionUserInfoFunction = async ({
    requestUserAgent,
  } = {}) => {
    const { subscriptionUserinfo } = await getShadowsocksSubscription(
      this.url,
      this.udpRelay,
      requestUserAgent || this.config.requestUserAgent,
    )

    if (subscriptionUserinfo) {
      return subscriptionUserinfo
    }
    return undefined
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<Array<ShadowsocksNodeConfig>> => {
    const { requestUserAgent } = params
    const { nodeList } = await getShadowsocksSubscription(
      this.url,
      this.udpRelay,
      requestUserAgent || this.config.requestUserAgent,
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

/**
 * @see https://shadowsocks.org/en/spec/SIP002-URI-Scheme.html
 */
export const getShadowsocksSubscription = async (
  url: string,
  udpRelay?: boolean,
  requestUserAgent?: string,
): Promise<{
  readonly nodeList: Array<ShadowsocksNodeConfig>
  readonly subscriptionUserinfo?: SubscriptionUserinfo
}> => {
  assert(url, '未指定订阅地址 url')

  const response = await Provider.requestCacheableResource(url, {
    requestUserAgent,
  })
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
