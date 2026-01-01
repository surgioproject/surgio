import assert from 'assert'
import { z } from 'zod'

import {
  NodeTypeEnum,
  ShadowsocksJsonSubscribeProviderConfig,
  ShadowsocksNodeConfig,
} from '../types'
import { SurgioError } from '../utils'
import relayableUrl from '../utils/relayable-url'

import Provider from './Provider'
import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetNodeListV2Function,
  GetNodeListV2Result,
} from './types'

export default class ShadowsocksJsonSubscribeProvider extends Provider {
  readonly #originalUrl: string
  public readonly udpRelay?: boolean

  constructor(name: string, config: ShadowsocksJsonSubscribeProviderConfig) {
    super(name, config)

    const schema = z.object({
      url: z.string().url(),
      udpRelay: z.boolean().optional(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('ShadowsocksJsonSubscribeProvider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.#originalUrl = result.data.url
    this.udpRelay = result.data.udpRelay
  }

  // istanbul ignore next
  public get url(): string {
    return relayableUrl(this.#originalUrl, this.config.relayUrl)
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<Array<ShadowsocksNodeConfig>> => {
    const requestHeaders = this.determineRequestHeaders(
      'shadowrocket',
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(requestHeaders, this.url)
    const nodeList = await getShadowsocksJSONConfig(
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
    const nodeList = await this.getNodeList(params)
    return { nodeList }
  }
}

export const getShadowsocksJSONConfig = async (
  url: string,
  requestHeaders: DefaultProviderRequestHeaders,
  cacheKey: string,
  udpRelay?: boolean,
): Promise<Array<ShadowsocksNodeConfig>> => {
  assert(url, '未指定订阅地址 url')

  async function requestConfigFromRemote(): Promise<
    Array<ShadowsocksNodeConfig>
  > {
    const response = await Provider.requestCacheableResource(
      url,
      requestHeaders,
      cacheKey,
    )
    const config = JSON.parse(response.body) as {
      configs?: ReadonlyArray<any>
    }

    if (!config || !config.configs) {
      throw new Error('订阅地址返回的数据格式不正确')
    }

    return config.configs.map((item): ShadowsocksNodeConfig => {
      const nodeConfig: any = {
        nodeName: item.remarks as string,
        type: NodeTypeEnum.Shadowsocks,
        hostname: item.server as string,
        port: item.server_port as string,
        method: item.method as string,
        password: item.password as string,
      }

      if (typeof udpRelay === 'boolean') {
        nodeConfig.udpRelay = udpRelay
      }
      if (item.plugin === 'obfs-local') {
        const obfs = item.plugin_opts.match(/obfs=(\w+)/)
        const obfsHost = item.plugin_opts.match(/obfs-host=(.+)$/)

        if (obfs) {
          nodeConfig.obfs = obfs[1]
          nodeConfig.obfsHost = obfsHost ? obfsHost[1] : 'www.bing.com'
        }
      }

      return nodeConfig
    })
  }

  return await requestConfigFromRemote()
}
