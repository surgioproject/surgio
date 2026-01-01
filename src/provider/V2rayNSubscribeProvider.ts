import assert from 'assert'
import { logger } from '@surgio/logger'
import { z } from 'zod'
import _ from 'lodash'

import {
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  V2rayNSubscribeProviderConfig,
  VmessNodeConfig,
} from '../types'
import { fromBase64, SurgioError } from '../utils'
import relayableUrl from '../utils/relayable-url'
import { parseSSUri } from '../utils/ss'

import Provider from './Provider'
import {
  DefaultProviderRequestHeaders,
  GetNodeListFunction,
  GetNodeListV2Function,
  GetNodeListV2Result,
} from './types'

export default class V2rayNSubscribeProvider extends Provider {
  public readonly compatibleMode?: boolean
  public readonly skipCertVerify?: boolean
  public readonly udpRelay?: boolean
  public readonly tls13?: boolean

  readonly #originalUrl: string

  constructor(name: string, config: V2rayNSubscribeProviderConfig) {
    super(name, config)

    const schema = z.object({
      url: z.string().url(),
      udpRelay: z.boolean().optional(),
      tls13: z.boolean().optional(),
      compatibleMode: z.boolean().optional(),
      skipCertVerify: z.boolean().optional(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('V2rayNSubscribeProvider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.#originalUrl = result.data.url
    this.compatibleMode = result.data.compatibleMode
    this.skipCertVerify = result.data.skipCertVerify
    this.tls13 = result.data.tls13
    this.udpRelay = result.data.udpRelay
  }

  // istanbul ignore next
  public get url(): string {
    return relayableUrl(this.#originalUrl, this.config.relayUrl)
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): ReturnType<typeof getV2rayNSubscription> => {
    const requestHeaders = this.determineRequestHeaders(
      params.requestUserAgent,
      params.requestHeaders,
    )
    const cacheKey = Provider.getResourceCacheKey(
      requestHeaders, this.url,
    )
    const nodeList = await getV2rayNSubscription({
      url: this.url,
      skipCertVerify: this.skipCertVerify,
      tls13: this.tls13,
      udpRelay: this.udpRelay,
      isCompatibleMode: this.compatibleMode,
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
    const nodeList = await this.getNodeList(params)
    return { nodeList }
  }
}

/**
 * @see https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
 */
export const getV2rayNSubscription = async ({
  url,
  isCompatibleMode,
  skipCertVerify,
  tls13,
  udpRelay,
  requestHeaders,
  cacheKey,
}: {
  url: string
  isCompatibleMode?: boolean
  skipCertVerify?: boolean
  udpRelay?: boolean
  tls13?: boolean
  requestHeaders: DefaultProviderRequestHeaders
  cacheKey: string
}): Promise<Array<VmessNodeConfig | ShadowsocksNodeConfig>> => {
  assert(url, '未指定订阅地址 url')

  if (isCompatibleMode) {
    logger.warn('运行在兼容模式，请注意生成的节点是否正确。')
  }

  async function requestConfigFromRemote(): Promise<
    Array<VmessNodeConfig | ShadowsocksNodeConfig>
  > {
    const response = await Provider.requestCacheableResource(
      url,
      requestHeaders,
      cacheKey,
    )
    const configString = response.body

    const configList = fromBase64(configString)
      .split('\n')
      .filter((item) => !!item)
      .filter((item) => {
        const pick = item.startsWith('vmess://') || item.startsWith('ss://')

        if (!pick) {
          logger.warn(
            `不支持读取 V2rayN 订阅中的节点 ${item}，该节点会被省略。`,
          )
        }

        return pick
      })

    return configList
      .map((item): VmessNodeConfig | ShadowsocksNodeConfig | undefined => {
        if (item.startsWith('vmess://')) {
          return parseJSONConfig(
            fromBase64(item.replace('vmess://', '')),
            isCompatibleMode,
            skipCertVerify,
            udpRelay,
            tls13,
          )
        }

        if (item.startsWith('ss://')) {
          return {
            ...parseSSUri(item),
            udpRelay: udpRelay === true,
            skipCertVerify: skipCertVerify === true,
            tls13: tls13 === true,
          }
        }

        return undefined
      })
      .filter((item): item is VmessNodeConfig | ShadowsocksNodeConfig => !!item)
  }

  return await requestConfigFromRemote()
}

export const parseJSONConfig = (
  json: string,
  isCompatibleMode?: boolean | undefined,
  skipCertVerify?: boolean | undefined,
  udpRelay?: boolean | undefined,
  tls13?: boolean | undefined,
): VmessNodeConfig | undefined => {
  const config = JSON.parse(json)

  // istanbul ignore next
  if (!isCompatibleMode && (!config.v || Number(config.v) !== 2)) {
    throw new Error(
      `该节点 ${config.ps} 可能不是一个有效的 V2rayN 节点。请参考 https://url.royli.dev/Qtrci 进行排查，或者将解析模式改为兼容模式`,
    )
  }

  // istanbul ignore next
  if (!['tcp', 'ws', 'h2', 'grpc'].includes(config.net)) {
    logger.warn(
      `不支持读取 network 类型为 ${config.net} 的 Vmess 节点，节点 ${config.ps} 会被省略。`,
    )
    return undefined
  }

  // istanbul ignore next
  if (!['none', 'http'].includes(config.type)) {
    logger.warn(
      `不支持读取 type 类型为 ${config.type} 的 Vmess 节点，节点 ${config.ps} 会被省略。`,
    )
    return undefined
  }

  const vmessNode: VmessNodeConfig = {
    nodeName: config.ps,
    type: NodeTypeEnum.Vmess,
    hostname: config.add,
    port: config.port,
    method: config.scy || 'auto',
    uuid: config.id,
    alterId: config.aid || '0',
    network: config.net,
    udpRelay: udpRelay === true,
    tls: config.tls === 'tls',
  }

  if (vmessNode.tls) {
    if (skipCertVerify) {
      vmessNode.skipCertVerify = true
    }
    if (tls13) {
      vmessNode.tls13 = true
    }
    if (config.sni) {
      vmessNode.sni = config.sni
    }
  }

  switch (config.net) {
    case 'tcp':
      if (config.type === 'http') {
        vmessNode.network = 'http'

        _.set(vmessNode, 'httpOpts.path', [config.path || '/'])
        _.set(vmessNode, 'httpOpts.method', 'GET')

        if (config.host) {
          _.set(vmessNode, 'httpOpts.headers.Host', config.host)
        }
      }

      break
    case 'ws':
      _.set(vmessNode, 'wsOpts.path', config.path || '/')

      if (config.host) {
        _.set(vmessNode, 'wsOpts.headers.Host', config.host)
      }

      break
    case 'h2':
      _.set(vmessNode, 'h2Opts.path', config.path || '/')

      if (config.host) {
        _.set(vmessNode, 'h2Opts.host', [config.host])
      }

      break
    case 'grpc':
      _.set(vmessNode, 'grpcOpts.serviceName', config.path)

      break
  }

  return vmessNode
}
