import { isIPv4 } from 'net'
import { createLogger } from '@surgio/logger'
import _ from 'lodash'

import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types'
import { ERR_INVALID_FILTER, LOON_SUPPORTED_VMESS_NETWORK } from '../constant'
import { applyFilter, internalFilters } from '../filters'

import { getHeader } from './index'

const {
  httpFilter,
  httpsFilter,
  shadowsocksFilter,
  shadowsocksrFilter,
  trojanFilter,
  vmessFilter,
  wireguardFilter,
  vlessFilter,
} = internalFilters
const logger = createLogger({ service: 'surgio:utils:loon' })

// https://loon0x00.github.io/LoonManual/#/cn/node
export const getLoonNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  const result: ReadonlyArray<string> = applyFilter(list, filter)
    .map((nodeConfig): string | undefined => {
      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = Shadowsocks`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.method,
            JSON.stringify(nodeConfig.password),
          ]

          if (nodeConfig.obfs) {
            if (['http', 'tls'].includes(nodeConfig.obfs)) {
              config.push(
                nodeConfig.obfs,
                nodeConfig.obfsHost || nodeConfig.hostname,
              )
            } else {
              logger.warn(
                `不支持为 Loon 生成混淆为 ${nodeConfig.obfs} 的节点，节点 ${nodeConfig.nodeName} 会被省略`,
              )
              return void 0
            }
          }

          if (nodeConfig.tfo) {
            config.push('fast-open=true')
          }

          if (nodeConfig.udpRelay) {
            config.push('udp=true')
          }

          return config.join(',')
        }

        case NodeTypeEnum.Shadowsocksr: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = ShadowsocksR`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.method,
            JSON.stringify(nodeConfig.password),
            `protocol=${nodeConfig.protocol}`,
            `protocol-param=${nodeConfig.protoparam}`,
            `obfs=${nodeConfig.obfs}`,
            `obfs-param=${nodeConfig.obfsparam}`,
          ]

          if (nodeConfig.tfo) {
            config.push('fast-open=true')
          }

          if (nodeConfig.udpRelay) {
            config.push('udp=true')
          }

          return config.join(',')
        }

        case NodeTypeEnum.Vless:
        case NodeTypeEnum.Vmess: {
          if (
            !LOON_SUPPORTED_VMESS_NETWORK.includes(nodeConfig.network as any)
          ) {
            logger.warn(
              `Loon 不支持 ${
                nodeConfig.network
              } 的 ${nodeConfig.type.toUpperCase()} 节点，节点 ${
                nodeConfig.nodeName
              } 会被省略`,
            )
            return void 0
          }

          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = ${
              nodeConfig.type === NodeTypeEnum.Vmess ? 'vmess' : 'VLESS'
            }`,
            nodeConfig.hostname,
            nodeConfig.port,
          ]

          if (nodeConfig.type === NodeTypeEnum.Vmess) {
            config.push(
              nodeConfig.method === 'auto'
                ? `chacha20-poly1305`
                : nodeConfig.method,
            )
          }

          config.push(
            JSON.stringify(nodeConfig.uuid),
            `transport=${nodeConfig.network}`,
          )

          if (nodeConfig.network === 'ws' && nodeConfig.wsOpts) {
            const obfsHost = getHeader(nodeConfig.wsOpts.headers, 'Host')

            config.push(`path=${nodeConfig.wsOpts.path || '/'}`)

            if (obfsHost) {
              config.push(`host=${obfsHost}`)
            }
          }

          if (nodeConfig.network === 'http' && nodeConfig.httpOpts) {
            const obfsHost = getHeader(nodeConfig.httpOpts.headers, 'Host')

            config.push(`path=${nodeConfig.httpOpts.path || '/'}`)

            if (obfsHost) {
              config.push(`host=${obfsHost}`)
            }

            // istanbul ignore next
            if (nodeConfig.httpOpts.method !== 'GET') {
              logger.warn(
                `Loon 不支持自定义 VMESS+HTTP 节点的 method 属性，节点 ${nodeConfig.nodeName} 可能不可用`,
              )
            }
          }

          if (
            (nodeConfig.type === NodeTypeEnum.Vmess && nodeConfig.tls) ||
            nodeConfig.type === NodeTypeEnum.Vless
          ) {
            config.push(`over-tls=true`)

            if (nodeConfig.sni) {
              config.push(`tls-name=${nodeConfig.sni}`)
            }

            if (nodeConfig.skipCertVerify) {
              config.push(`skip-cert-verify=true`)
            }
          }

          return config.join(',')
        }

        case NodeTypeEnum.Trojan: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = trojan`,
            nodeConfig.hostname,
            nodeConfig.port,
            JSON.stringify(nodeConfig.password),
            `tls-name=${nodeConfig.sni || nodeConfig.hostname}`,
            `skip-cert-verify=${nodeConfig.skipCertVerify === true}`,
          ]

          if (nodeConfig.network === 'ws') {
            config.push('transport=ws', `path=${nodeConfig.wsPath || '/'}`)

            if (nodeConfig.wsHeaders) {
              if (_.get(nodeConfig, 'wsHeaders.host')) {
                config.push(`host=${nodeConfig.wsHeaders.host}`)
              }

              if (
                Object.keys(_.omit(nodeConfig.wsHeaders, 'host')).length > 0
              ) {
                logger.warn(
                  `Loon 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
                )
              }
            }
          }

          if (nodeConfig.tfo) {
            config.push('fast-open=true')
          }

          if (nodeConfig.udpRelay) {
            config.push('udp=true')
          }

          return config.join(',')
        }

        case NodeTypeEnum.HTTPS: {
          const config: Array<string | number> = [
            `${nodeConfig.nodeName} = https`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.username /* istanbul ignore next */ || '',
            JSON.stringify(
              nodeConfig.password /* istanbul ignore next */ || '',
            ),
            `tls-name=${nodeConfig.sni || nodeConfig.hostname}`,
            `skip-cert-verify=${nodeConfig.skipCertVerify === true}`,
          ]

          return config.join(',')
        }

        case NodeTypeEnum.HTTP:
          return [
            `${nodeConfig.nodeName} = http`,
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.username /* istanbul ignore next */ || '',
            JSON.stringify(
              nodeConfig.password /* istanbul ignore next */ || '',
            ),
          ].join(',')

        case NodeTypeEnum.Wireguard: {
          const config = [
            `${nodeConfig.nodeName} = wireguard`,
            `interface-ip=${nodeConfig.selfIp}`,
            `private-key=${JSON.stringify(nodeConfig.privateKey)}`,
          ]
          const peers: Array<string> = []

          if (nodeConfig.selfIpV6) {
            config.push(`interface-ipV6=${nodeConfig.selfIpV6}`)
          }
          if (nodeConfig.mtu) {
            config.push(`mtu=${nodeConfig.mtu}`)
          }
          if (nodeConfig.dnsServers) {
            for (const dns of nodeConfig.dnsServers) {
              if (isIPv4(dns)) {
                config.push(`dns=${dns}`)
              } else {
                config.push(`dnsV6=${dns}`)
              }
            }
          }

          if (nodeConfig.peers[0].keepalive) {
            config.push(`keepalive=${nodeConfig.peers[0].keepalive}`)
          }

          for (const peer of nodeConfig.peers) {
            const peerConfig = [
              `public-key=${JSON.stringify(peer.publicKey)}`,
              `endpoint=${peer.endpoint}`,
            ]

            if (peer.allowedIps) {
              peerConfig.push(`allowed-ips=${JSON.stringify(peer.allowedIps)}`)
            }
            if (peer.presharedKey) {
              peerConfig.push(
                `preshared-key=${JSON.stringify(peer.presharedKey)}`,
              )
            }
            if (peer.reservedBits) {
              peerConfig.push(`reserved=${JSON.stringify(peer.reservedBits)}`)
            }

            peers.push(`{${peerConfig.join(',')}}`)
          }

          config.push(`peers=[${peers.join(',')}]`)

          return config.join(',')
        }

        // istanbul ignore next
        default:
          logger.warn(
            `不支持为 Loon 生成 ${nodeConfig.type} 的节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return void 0
      }
    })
    .filter((item): item is string => item !== undefined)

  return result.join('\n')
}

export const getLoonNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  separator?: string,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  return applyFilter(
    list.filter(
      (item) =>
        shadowsocksFilter(item) ||
        shadowsocksrFilter(item) ||
        vmessFilter(item) ||
        httpFilter(item) ||
        httpsFilter(item) ||
        trojanFilter(item) ||
        wireguardFilter(item) ||
        vlessFilter(item),
    ),
    filter,
  )
    .map((item) => item.nodeName)
    .join(separator || ', ')
}
