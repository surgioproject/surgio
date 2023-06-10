import assert from 'assert'
import yaml from 'yaml'
import _ from 'lodash'
import { createLogger } from '@surgio/logger'
import { z } from 'zod'

import {
  ClashProviderConfig,
  HttpNodeConfig,
  HttpsNodeConfig,
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SnellNodeConfig,
  SubscriptionUserinfo,
  TrojanNodeConfig,
  TuicNodeConfig,
  VmessNodeConfig,
} from '../types'
import { lowercaseHeaderKeys } from '../utils'
import { getNetworkClashUA } from '../utils/env-flag'
import relayableUrl from '../utils/relayable-url'
import Provider from './Provider'
import { GetNodeListFunction, GetSubscriptionUserInfoFunction } from './types'

type SupportConfigTypes =
  | ShadowsocksNodeConfig
  | VmessNodeConfig
  | HttpsNodeConfig
  | HttpNodeConfig
  | ShadowsocksrNodeConfig
  | SnellNodeConfig
  | TrojanNodeConfig
  | TuicNodeConfig

const logger = createLogger({
  service: 'surgio:ClashProvider',
})

export default class ClashProvider extends Provider {
  readonly #originalUrl: string
  public readonly udpRelay?: boolean
  public readonly tls13?: boolean

  constructor(name: string, config: ClashProviderConfig) {
    super(name, config)

    const schema = z.object({
      url: z.string().url(),
      udpRelay: z.boolean().optional(),
      tls13: z.boolean().optional(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw result.error
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
    const requestUserAgent = this.determineRequestUserAgent(
      params.requestUserAgent,
    )
    const { subscriptionUserinfo } = await getClashSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestUserAgent,
    })

    if (subscriptionUserinfo) {
      return subscriptionUserinfo
    }

    return undefined
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<SupportConfigTypes[]> => {
    const requestUserAgent = this.determineRequestUserAgent(
      params.requestUserAgent,
    )
    const { nodeList } = await getClashSubscription({
      url: this.url,
      udpRelay: this.udpRelay,
      tls13: this.tls13,
      requestUserAgent,
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
}

export const getClashSubscription = async ({
  url,
  udpRelay,
  tls13,
  requestUserAgent,
}: {
  url: string
  udpRelay?: boolean
  tls13?: boolean
  requestUserAgent?: string
}): Promise<{
  readonly nodeList: Array<SupportConfigTypes>
  readonly subscriptionUserinfo?: SubscriptionUserinfo
}> => {
  assert(url, '未指定订阅地址 url')

  const response = await Provider.requestCacheableResource(url, {
    requestUserAgent: requestUserAgent || getNetworkClashUA(),
  })
  let clashConfig

  try {
    // eslint-disable-next-line prefer-const
    clashConfig = yaml.parse(response.body)
  } catch (err) /* istanbul ignore next */ {
    throw new Error(`${url} 不是一个合法的 YAML 文件`)
  }

  if (
    !_.isPlainObject(clashConfig) ||
    (!('Proxy' in clashConfig) && !('proxies' in clashConfig))
  ) {
    throw new Error(`${url} 订阅内容有误，请检查后重试`)
  }

  const proxyList: any[] = clashConfig.Proxy || clashConfig.proxies

  // istanbul ignore next
  if (!Array.isArray(proxyList)) {
    throw new Error(`${url} 订阅内容有误，请检查后重试`)
  }

  return {
    nodeList: parseClashConfig(proxyList, udpRelay, tls13),
    subscriptionUserinfo: response.subscriptionUserinfo,
  }
}

export const parseClashConfig = (
  proxyList: Array<any>,
  udpRelay?: boolean,
  tls13?: boolean,
): Array<SupportConfigTypes> => {
  const nodeList: Array<SupportConfigTypes | undefined> = proxyList.map(
    (item) => {
      switch (item.type) {
        case 'ss': {
          // istanbul ignore next
          if (item.plugin && !['obfs', 'v2ray-plugin'].includes(item.plugin)) {
            logger.warn(
              `不支持从 Clash 订阅中读取 ${item.plugin} 类型的 Shadowsocks 节点，节点 ${item.name} 会被省略`,
            )
            return undefined
          }
          // istanbul ignore next
          if (
            item.plugin === 'v2ray-plugin' &&
            item['plugin-opts'].mode.toLowerCase() === 'quic'
          ) {
            logger.warn(
              `不支持从 Clash 订阅中读取 QUIC 模式的 Shadowsocks 节点，节点 ${item.name} 会被省略`,
            )
            return undefined
          }

          const wsHeaders = lowercaseHeaderKeys(
            _.get(item, 'plugin-opts.headers', {}),
          )

          return {
            type: NodeTypeEnum.Shadowsocks,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            method: item.cipher,
            password: item.password,
            udpRelay: resolveUdpRelay(item.udp, udpRelay),

            // obfs-local 新格式
            ...(item.plugin && item.plugin === 'obfs'
              ? {
                  obfs: item['plugin-opts'].mode,
                  obfsHost: item['plugin-opts'].host || 'www.bing.com',
                }
              : null),

            // obfs-local 旧格式
            ...(item.obfs
              ? {
                  obfs: item.obfs,
                  obfsHost: item['obfs-host'] || 'www.bing.com',
                }
              : null),

            // v2ray-plugin
            ...(item.plugin &&
            item.plugin === 'v2ray-plugin' &&
            item['plugin-opts'].mode === 'websocket'
              ? {
                  obfs: item['plugin-opts'].tls === true ? 'wss' : 'ws',
                  obfsHost: item['plugin-opts'].host || item.server,
                  obfsUri: item['plugin-opts'].path || '/',
                  wsHeaders,
                  ...(item['plugin-opts'].tls === true
                    ? {
                        skipCertVerify:
                          item['plugin-opts']['skip-cert-verify'] === true,
                        tls13: tls13 ?? false,
                      }
                    : null),
                  ...(typeof item['plugin-opts'].mux === 'boolean'
                    ? {
                        mux: item['plugin-opts'].mux,
                      }
                    : null),
                }
              : null),
          } as ShadowsocksNodeConfig
        }

        case 'vmess': {
          // istanbul ignore next
          if (item.network && !['tcp', 'ws'].includes(item.network)) {
            logger.warn(
              `不支持从 Clash 订阅中读取 network 类型为 ${item.network} 的 Vmess 节点，节点 ${item.name} 会被省略`,
            )
            return undefined
          }

          const isNewConfig = 'ws-opts' in item
          const wsHeaders = isNewConfig
            ? lowercaseHeaderKeys(_.get(item, 'ws-opts.headers', {}))
            : lowercaseHeaderKeys(_.get(item, 'ws-headers', {}))
          const wsHost =
            item.servername || _.get(wsHeaders, 'host', item.server)
          const wsOpts = isNewConfig
            ? _.get(item, 'ws-opts', {})
            : {
                path: _.get(item, 'ws-path', '/'),
                headers: wsHeaders,
              }

          return {
            type: NodeTypeEnum.Vmess,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            uuid: item.uuid,
            alterId: item.alterId ? `${item.alterId}` : '0',
            method: item.cipher || 'auto',
            udpRelay: resolveUdpRelay(item.udp, udpRelay),
            tls: item.tls ?? false,
            network: item.network || 'tcp',
            ...(item.network === 'ws'
              ? {
                  host: wsHost,
                  path: _.get(wsOpts, 'path', '/'),
                  wsHeaders,
                }
              : null),
            ...(item.tls
              ? {
                  skipCertVerify: item['skip-cert-verify'] === true,
                  tls13: tls13 ?? false,
                }
              : null),
          } as VmessNodeConfig
        }

        case 'http':
          if (!item.tls) {
            return {
              type: NodeTypeEnum.HTTP,
              nodeName: item.name,
              hostname: item.server,
              port: item.port,
              username: item.username /* istanbul ignore next */ || '',
              password: item.password /* istanbul ignore next */ || '',
            } as HttpNodeConfig
          }

          return {
            type: NodeTypeEnum.HTTPS,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            username: item.username || '',
            password: item.password || '',
            tls13: tls13 ?? false,
            skipCertVerify: item['skip-cert-verify'] === true,
          } as HttpsNodeConfig

        case 'snell':
          return {
            type: NodeTypeEnum.Snell,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            psk: item.psk,
            obfs: _.get(item, 'obfs-opts.mode', 'http'),
            ...(typeof item?.['obfs-opts']?.host !== 'undefined'
              ? { obfsHost: item['obfs-opts'].host }
              : null),
            ...('version' in item ? { version: item.version } : null),
          } as SnellNodeConfig

        // istanbul ignore next
        case 'ssr':
          return {
            type: NodeTypeEnum.Shadowsocksr,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            password: item.password,
            obfs: item.obfs,
            obfsparam: item['obfs-param'] ?? item.obfsparam,
            protocol: item.protocol,
            protoparam: item['protocol-param'] ?? item.protocolparam,
            method: item.cipher,
            udpRelay: resolveUdpRelay(item.udp, udpRelay),
          } as ShadowsocksrNodeConfig

        case 'trojan': {
          const network = item.network
          const wsOpts = _.get(item, 'ws-opts', {})
          const wsHeaders = lowercaseHeaderKeys(_.get(wsOpts, 'headers', {}))

          return {
            type: NodeTypeEnum.Trojan,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            password: item.password,
            ...('skip-cert-verify' in item
              ? { skipCertVerify: item['skip-cert-verify'] === true }
              : null),
            ...('alpn' in item ? { alpn: item.alpn } : null),
            ...('sni' in item ? { sni: item.sni } : null),
            udpRelay: resolveUdpRelay(item.udp, udpRelay),
            tls13: tls13 ?? false,
            ...(network === 'ws'
              ? { network: 'ws', wsPath: _.get(wsOpts, 'path', '/'), wsHeaders }
              : null),
          } as TrojanNodeConfig
        }

        case 'tuic': {
          if (item.version >= 5) {
            return {
              type: NodeTypeEnum.Tuic,
              version: item.version,
              nodeName: item.name,
              hostname: item.server,
              port: item.port,
              password: item.password,
              uuid: item.uuid,
              ...('skip-cert-verify' in item
                ? { skipCertVerify: item['skip-cert-verify'] === true }
                : null),
              tls13: tls13 ?? false,
              ...('sni' in item ? { sni: item.sni } : null),
              ...('alpn' in item ? { alpn: item.alpn } : null),
            } as TuicNodeConfig
          }

          return {
            type: NodeTypeEnum.Tuic,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            token: item.token,
            ...('skip-cert-verify' in item
              ? { skipCertVerify: item['skip-cert-verify'] === true }
              : null),
            tls13: tls13 ?? false,
            ...('sni' in item ? { sni: item.sni } : null),
            ...('alpn' in item ? { alpn: item.alpn } : null),
          } as TuicNodeConfig
        }

        default:
          logger.warn(
            `不支持从 Clash 订阅中读取 ${item.type} 的节点，节点 ${item.name} 会被省略`,
          )
          return undefined
      }
    },
  )

  return nodeList.filter(
    (item): item is SupportConfigTypes => item !== undefined,
  )
}

function resolveUdpRelay(val?: boolean, defaultVal = false): boolean {
  if (val !== void 0) {
    return val
  }
  return defaultVal
}
