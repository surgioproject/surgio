import { z } from 'zod'

import {
  CustomProviderConfig,
  NodeTypeEnum,
  PossibleNodeConfigType,
} from '../types'
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
      throw result.error
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

    for (const node of nodeList) {
      const type = node.type as NodeTypeEnum

      // istanbul ignore next
      if (node['udp-relay']) {
        throw new Error('udp-relay is abandoned, please use udpRelay instead')
      }

      // istanbul ignore next
      if (node['obfs-host']) {
        throw new Error('obfs-host is abandoned, please use obfsHost instead')
      }

      // istanbul ignore next
      if (node['obfs-uri']) {
        throw new Error('obfs-uri is abandoned, please use obfsUri instead')
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
            throw new TypeError(`Unexpected object: ${type}`)
        }
      })()

      const propertyKeysMustBeLowercase = ['wsHeaders']

      if (this.underlyingProxy && !parsedNode.underlyingProxy) {
        parsedNode.underlyingProxy = this.underlyingProxy
      }

      propertyKeysMustBeLowercase.forEach((key) => {
        if (parsedNode[key]) {
          parsedNode[key] = Object.keys(parsedNode[key]).reduce((acc, curr) => {
            acc[curr.toLowerCase()] = parsedNode[key][curr]
            return acc
          }, {})
        }
      })

      parsedNodeList.push(parsedNode)
    }

    if (this.config.hooks?.afterFetchNodeList) {
      const newList = await this.config.hooks.afterFetchNodeList(
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
