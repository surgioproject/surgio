import { z } from 'zod'

import {
  CustomProviderConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
  VmessNodeConfig,
} from '../types'
import { SurgioError } from '../utils'
import {
  WireguardNodeConfigValidator,
  ShadowsocksNodeConfigValidator,
  HttpNodeConfigValidator,
  HttpsNodeConfigValidator,
  TrojanNodeConfigValidator,
  ShadowsocksrNodeConfigValidator,
  Socks5NodeConfigValidator,
  VmessNodeConfigValidator,
  SnellNodeConfigValidator,
  TuicNodeConfigValidator,
  Hysteria2NodeConfigValidator,
  VlessNodeConfigValidator,
  AnyTLSNodeConfigValidator,
} from '../validators'

import Provider from './Provider'
import {
  GetNodeListFunction,
  GetNodeListParams,
  GetNodeListV2Function,
  GetNodeListV2Result,
} from './types'

export default class CustomProvider extends Provider {
  public readonly nodeList:
    | unknown[]
    | ((params: GetNodeListParams) => Promise<unknown[]>)
  public readonly underlyingProxy?: string

  constructor(name: string, config: CustomProviderConfig) {
    super(name, config)

    const schema = z.object({
      nodeList: z.union([
        z.array(z.any()),
        z.function().args(z.any()).returns(z.any()),
      ]),
      underlyingProxy: z.ostring(),
    })
    const result = schema.safeParse(config)

    // istanbul ignore next
    if (!result.success) {
      throw new SurgioError('CustomProvider 配置校验失败', {
        cause: result.error,
        providerName: name,
      })
    }

    this.nodeList = result.data.nodeList
    this.underlyingProxy = result.data.underlyingProxy
  }

  public getNodeList: GetNodeListFunction = async (
    params = {},
  ): Promise<Array<PossibleNodeConfigType>> => {
    let nodeList: any[]
    const parsedNodeList: PossibleNodeConfigType[] = []

    if (typeof this.nodeList === 'function') {
      nodeList = await this.nodeList(params)
    } else {
      nodeList = this.nodeList
    }

    nodeList.forEach((node, index) => {
      try {
        const type = node.type as NodeTypeEnum

        // istanbul ignore next
        if (node['udp-relay']) {
          throw new Error('udp-relay 已废弃，请使用 udpRelay')
        }

        // istanbul ignore next
        if (node['obfs-host']) {
          throw new Error('obfs-host 已废弃，请使用 obfsHost')
        }

        // istanbul ignore next
        if (node['obfs-uri']) {
          throw new Error('obfs-uri 已废弃，请使用 obfsUri')
        }

        // istanbul ignore next
        let parsedNode = (() => {
          switch (type) {
            case NodeTypeEnum.Shadowsocks:
              return ShadowsocksNodeConfigValidator.parse(node)

            case NodeTypeEnum.Shadowsocksr:
              return ShadowsocksrNodeConfigValidator.parse(node)

            case NodeTypeEnum.Vmess:
              return VmessNodeConfigValidator.parse(node)

            case NodeTypeEnum.Trojan:
              return TrojanNodeConfigValidator.parse(node)

            case NodeTypeEnum.Socks5:
              return Socks5NodeConfigValidator.parse(node)

            case NodeTypeEnum.HTTP:
              return HttpNodeConfigValidator.parse(node)

            case NodeTypeEnum.HTTPS:
              return HttpsNodeConfigValidator.parse(node)

            case NodeTypeEnum.Snell:
              return SnellNodeConfigValidator.parse(node)

            case NodeTypeEnum.Tuic:
              return TuicNodeConfigValidator.parse(node)

            case NodeTypeEnum.Wireguard:
              return WireguardNodeConfigValidator.parse(node)

            case NodeTypeEnum.Hysteria2:
              return Hysteria2NodeConfigValidator.parse(node)

            case NodeTypeEnum.Vless:
              return VlessNodeConfigValidator.parse(node)

            case NodeTypeEnum.AnyTLS:
              return AnyTLSNodeConfigValidator.parse(node)

            default:
              throw new TypeError(`无法识别的节点类型：${type}`)
          }
        })()

        if (this.underlyingProxy && !parsedNode.underlyingProxy) {
          parsedNode.underlyingProxy = this.underlyingProxy
        }

        if (parsedNode.type === NodeTypeEnum.Vmess) {
          parsedNode = this.prepareVmessNodeConfig(parsedNode)
        }

        parsedNodeList.push(parsedNode)
      } catch (err) {
        throw new SurgioError('节点配置校验失败', {
          providerName: this.name,
          nodeIndex: index,
          cause: err,
        })
      }
    })

    if (this.config.hooks?.afterNodeListResponse) {
      const newList = await this.config.hooks.afterNodeListResponse(
        parsedNodeList,
        params,
      )

      if (newList) {
        return newList
      }
    }

    return parsedNodeList
  }

  public getNodeListV2: GetNodeListV2Function = async (
    params = {},
  ): Promise<GetNodeListV2Result> => {
    const nodeList = await this.getNodeList(params)
    return { nodeList }
  }

  public prepareVmessNodeConfig(node: VmessNodeConfig): VmessNodeConfig {
    if (node.host) {
      node.sni = node.host
    }

    if (node.wsHeaders) {
      if (!node.wsOpts) {
        node.wsOpts = {
          headers: node.wsHeaders,
          path: node.path || '/',
        }
      } else if (node.wsOpts.headers) {
        throw new Error('wsOpts.headers 和 wsHeaders 不能同时存在')
      } else {
        node.wsOpts.headers = node.wsHeaders
      }
    }

    if (node.network === 'ws' && node.path) {
      throw new Error('请将 path 移动到 wsOpts.path')
    }

    if (node.network === 'h2' && node.path) {
      throw new Error('请将 path 移动到 h2Opts.path')
    }

    if (node.network === 'http' && node.path) {
      throw new Error('请将 path 移动到 httpOpts.path')
    }

    return node
  }
}
