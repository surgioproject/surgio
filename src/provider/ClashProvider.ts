import assert from 'assert'
import yaml from 'yaml'
import _ from 'lodash'
import { createLogger } from '@surgio/logger'
import { z } from 'zod'
import {
  CLASH_META_SUPPORTED_VMESS_NETWORK,
  STASH_SUPPORTED_VMESS_NETWORK,
} from '../constant'

import {
  ClashProviderConfig,
  HttpNodeConfig,
  HttpsNodeConfig,
  Hysteria2NodeConfig,
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SnellNodeConfig,
  SubscriptionUserinfo,
  TrojanNodeConfig,
  TuicNodeConfig,
  VlessNodeConfig,
  VmessNodeConfig,
  Socks5NodeConfig,
} from '../types'
import {
  lowercaseHeaderKeys,
  SurgioError,
  getNetworkClashUA,
  parseBitrate,
} from '../utils'
import relayableUrl from '../utils/relayable-url'
import Provider from './Provider'
import { GetNodeListFunction, GetSubscriptionUserInfoFunction } from './types'

type SupportConfigTypes =
  | ShadowsocksNodeConfig
  | VmessNodeConfig
  | VlessNodeConfig
  | HttpsNodeConfig
  | HttpNodeConfig
  | ShadowsocksrNodeConfig
  | SnellNodeConfig
  | TrojanNodeConfig
  | TuicNodeConfig
  | Hysteria2NodeConfig
  | Socks5NodeConfig

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
      throw new SurgioError('ClashProvider 配置校验失败', {
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

        case 'vless':
        case 'vmess': {
          // istanbul ignore next
          if (
            item.network &&
            ![
              ...CLASH_META_SUPPORTED_VMESS_NETWORK,
              ...STASH_SUPPORTED_VMESS_NETWORK,
            ].includes(item.network)
          ) {
            logger.warn(
              `不支持从 Clash 订阅中读取 network 类型为 ${item.network} 的 Vmess 节点，节点 ${item.name} 会被省略`,
            )
            return undefined
          }

          type NodeConfig = VlessNodeConfig | VmessNodeConfig
          const nodeType =
            item.type === 'vless' ? NodeTypeEnum.Vless : NodeTypeEnum.Vmess
          const fallbackCipherMethod = item.type === 'vless' ? 'none' : 'auto'

          const vmessNode = {
            type: nodeType,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            uuid: item.uuid,
            method: item.cipher || fallbackCipherMethod,
            udpRelay: resolveUdpRelay(item.udp, udpRelay),
            network: item.network || 'tcp',
          } as NodeConfig

          if (vmessNode.type === NodeTypeEnum.Vmess) {
            vmessNode.tls = item.tls === true
            vmessNode.alterId = item.alterId ? `${item.alterId}` : '0'
          }

          if (vmessNode.type === NodeTypeEnum.Vless && item.tls !== true) {
            logger.warn(
              `未经 TLS 传输的 Vless 协议不安全并且不被 Surgio 支持，节点 ${item.name} 会被省略`,
            )
            return undefined
          }

          if (vmessNode.type === NodeTypeEnum.Vless) {
            vmessNode.flow = item.flow

            if (item['reality-opts']) {
              vmessNode.realityOpts = {
                publicKey: item['reality-opts']['public-key'],
                shortId: item['reality-opts']['short-id'],
              }
            }
          }

          if (
            (vmessNode.type === NodeTypeEnum.Vmess && vmessNode.tls) ||
            vmessNode.type === NodeTypeEnum.Vless
          ) {
            if (typeof item.servername === 'string') {
              vmessNode.sni = item.servername
            }
            if (typeof item.sni === 'string') {
              vmessNode.sni = item.sni
            }

            vmessNode.skipCertVerify = item['skip-cert-verify'] === true
            vmessNode.tls13 = tls13 === true
          }

          switch (vmessNode.network) {
            case 'ws':
              vmessNode.wsOpts = item['ws-opts'] || {
                path: '/',
              }

              if (item['ws-path']) {
                vmessNode.wsOpts!.path = item['ws-path']
              }

              if (item['ws-headers']) {
                vmessNode.wsOpts!.headers = item['ws-headers']
              }

              break
            case 'h2':
              vmessNode.h2Opts = item['h2-opts']

              break
            case 'http':
              vmessNode.httpOpts = {
                ...item['http-opts'],
                headers:
                  resolveVmessHttpHeaders(item['http-opts'].headers) || {},
              }

              break
            case 'grpc':
              vmessNode.grpcOpts = {
                serviceName: item['grpc-opts']['grpc-service-name'],
              }

              break
          }

          return vmessNode
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

        case 'hysteria2':
          // istanbul ignore next
          if (item.obfs && item.obfs !== 'salamander') {
            throw new Error(
              '不支持从 Clash 订阅中读取 Hysteria2 节点，因为其 obfs 不是 salamander',
            )
          }

          return {
            type: NodeTypeEnum.Hysteria2,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
            password: item.auth || item.password,
            ...(item.down
              ? { downloadBandwidth: parseBitrate(item.down) }
              : null),
            ...(item.up ? { uploadBandwidth: parseBitrate(item.up) } : null),
            ...(item.obfs ? { obfs: item.obfs } : null),
            ...(item['obfs-password']
              ? { obfsPassword: item['obfs-password'] }
              : null),
            ...(item.sni ? { sni: item.sni } : null),
            ...('alpn' in item ? { alpn: item.alpn } : null),
            ...('skip-cert-verify' in item
              ? { skipCertVerify: item['skip-cert-verify'] === true }
              : null),
          } as Hysteria2NodeConfig

        case 'socks5': {
          const socks5Node = {
            type: NodeTypeEnum.Socks5,
            nodeName: item.name,
            hostname: item.server,
            port: item.port,
          } as Socks5NodeConfig

          if (item.username) {
            socks5Node.username = item.username
          }
          if (item.password) {
            socks5Node.password = item.password
          }
          if (item.udp) {
            socks5Node.udpRelay = item.udp
          }
          if (item.tls) {
            socks5Node.tls = item.tls
          }
          if (item['skip-cert-verify']) {
            socks5Node.skipCertVerify = item['skip-cert-verify']
          }

          return socks5Node
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

function resolveVmessHttpHeaders(
  headers: Record<string, string[]>,
): Record<string, string> {
  return Object.keys(headers).reduce((acc, key) => {
    if (headers[key].length) {
      acc[key] = headers[key][0]
    }
    return acc
  }, {} as Record<string, string>)
}
