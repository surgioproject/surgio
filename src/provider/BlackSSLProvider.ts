// istanbul ignore file

import assert from 'assert'
import { z } from 'zod'

import {
  BlackSSLProviderConfig,
  HttpsNodeConfig,
  NodeTypeEnum,
  SubscriptionUserinfo,
} from '../types'
import { SurgioError } from '../utils'
import { unifiedCache } from '../utils/cache'
import { getProviderCacheMaxage } from '../utils/env-flag'
import httpClient from '../utils/http-client'

import Provider from './Provider'
import { GetNodeListFunction, GetSubscriptionUserInfoFunction } from './types'

export default class BlackSSLProvider extends Provider {
  public readonly username: string
  public readonly password: string

  constructor(name: string, config: BlackSSLProviderConfig) {
    super(name, config)

    const schema = z.object({
      username: z.string(),
      password: z.string(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('BlackSSLProvider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.username = result.data.username
    this.password = result.data.password
    this.supportGetSubscriptionUserInfo = true
  }

  public getSubscriptionUserInfo: GetSubscriptionUserInfoFunction =
    async () => {
      const { subscriptionUserinfo } = await this.getBlackSSLConfig(
        this.username,
        this.password,
      )

      if (subscriptionUserinfo) {
        return subscriptionUserinfo
      }
      return undefined
    }

  public getNodeList: GetNodeListFunction = async (): Promise<
    Array<HttpsNodeConfig>
  > => {
    const { nodeList } = await this.getBlackSSLConfig(
      this.username,
      this.password,
    )

    if (this.config.hooks?.afterNodeListResponse) {
      const newList = await this.config.hooks.afterNodeListResponse(
        nodeList,
        {},
      )

      if (newList) {
        return newList
      }
    }

    return nodeList
  }

  // istanbul ignore next
  private async getBlackSSLConfig(
    username: string,
    password: string,
  ): Promise<{
    readonly nodeList: Array<HttpsNodeConfig>
    readonly subscriptionUserinfo?: SubscriptionUserinfo
  }> {
    assert(username, '未指定 BlackSSL username.')
    assert(password, '未指定 BlackSSL password.')

    const key = `blackssl_${username}`
    const cachedConfig = await unifiedCache.get<string>(key)

    const response = cachedConfig
      ? JSON.parse(cachedConfig)
      : await (async () => {
          const res = await httpClient.get(
            'https://api.darkssl.com/v1/service/ssl_info',
            {
              searchParams: {
                username,
                password,
              },
              headers: {
                'user-agent':
                  'GoAgentX/774 CFNetwork/901.1 Darwin/17.6.0 (x86_64)',
              },
            },
          )

          await unifiedCache.set(key, res.body, getProviderCacheMaxage())

          return JSON.parse(res.body)
        })()

    return {
      nodeList: (response.ssl_nodes as readonly any[]).map<HttpsNodeConfig>(
        (item) => ({
          nodeName: item.name,
          type: NodeTypeEnum.HTTPS,
          hostname: item.server,
          port: item.port,
          username,
          password,
        }),
      ),
      subscriptionUserinfo: {
        upload: 0,
        download: response.transfer_used,
        total: response.transfer_enable,
        expire: response.expired_at,
      },
    }
  }
}
