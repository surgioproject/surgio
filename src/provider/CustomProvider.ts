import { z } from 'zod'

import {
  CustomProviderConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
} from '../types'
import { SurgioError } from '../utils'
import Provider from './Provider'
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
} from '../validators'
import { GetNodeListFunction, GetNodeListParams } from './types'

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
          throw new Error('udp-relay 已废弃, 请使用 udpRelay')
        }

        // istanbul ignore next
        if (node['obfs-host']) {
          throw new Error('obfs-host 已废弃, 请使用 obfsHost')
        }

        // istanbul ignore next
        if (node['obfs-uri']) {
          throw new Error('obfs-uri 已废弃, 请使用 obfsUri')
        }

        const parsedNode = (() => {
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

            default:
              throw new TypeError(`无法识别的节点类型：${type}`)
          }
        })()
        const propertyKeysMustBeLowercase = ['wsHeaders'] as const

        if (this.underlyingProxy && !parsedNode.underlyingProxy) {
          parsedNode.underlyingProxy = this.underlyingProxy
        }

        propertyKeysMustBeLowercase.forEach((key) => {
          if (key in parsedNode && parsedNode[key] !== undefined) {
            parsedNode[key] = Object.keys(parsedNode[key] as any).reduce(
              (acc: any, curr) => {
                acc[curr.toLowerCase()] = (parsedNode[key] as any)[curr]
                return acc
              },
              {},
            )
          }
        })

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
}
