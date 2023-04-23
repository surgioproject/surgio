import { createLogger } from '@surgio/logger'
import _ from 'lodash'

import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types'
import { applyFilter } from './filter'
import { pickAndFormatStringList } from './index'

const logger = createLogger({ service: 'surgio:utils:quantumult' })

/**
 * @see https://github.com/crossutility/Quantumult-X/blob/master/sample.conf
 */
export const getQuantumultXNodes = function (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string {
  const result: ReadonlyArray<string> = applyFilter(nodeList, filter)
    .map(nodeListMapper)
    .filter((item): item is [string, string] => item !== undefined)
    .map((item) => item[1])

  return result.join('\n')
}

export const getQuantumultXNodeNames = function (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): string {
  return applyFilter(nodeList, filter)
    .map(nodeListMapper)
    .filter((item): item is [string, string] => item !== undefined)
    .map((item) => item[0])
    .join(', ')
}

function nodeListMapper(
  nodeConfig: PossibleNodeConfigType,
): [string, string] | undefined {
  switch (nodeConfig.type) {
    case NodeTypeEnum.Vmess: {
      const config = [
        `${nodeConfig.hostname}:${nodeConfig.port}`,
        // method 为 auto 时 qx 会无法识别
        nodeConfig.method === 'auto'
          ? `method=chacha20-ietf-poly1305`
          : `method=${nodeConfig.method}`,
        `password=${nodeConfig.uuid}`,
        ...(nodeConfig.udpRelay ? ['udp-relay=true'] : []),
        ...(nodeConfig.tfo ? ['fast-open=true'] : []),
        ...(nodeConfig.quantumultXConfig?.vmessAEAD
          ? ['aead=true']
          : ['aead=false']),
      ]

      switch (nodeConfig.network) {
        case 'ws':
          if (nodeConfig.tls) {
            config.push(`obfs=wss`)

            if (nodeConfig.skipCertVerify) {
              config.push('tls-verification=false')
            } else {
              config.push('tls-verification=true')
            }

            // istanbul ignore next
            if (nodeConfig.tls13) {
              config.push(`tls13=true`)
            }
          } else {
            config.push(`obfs=ws`)
          }
          config.push(`obfs-uri=${nodeConfig.path || '/'}`)
          config.push(`obfs-host=${nodeConfig.host || nodeConfig.hostname}`)

          break
        case 'tcp':
          if (nodeConfig.tls) {
            config.push(`obfs=over-tls`)

            if (nodeConfig.skipCertVerify) {
              config.push('tls-verification=false')
            } else {
              config.push('tls-verification=true')
            }

            // istanbul ignore next
            if (nodeConfig.tls13) {
              config.push(`tls13=true`)
            }
          }

          break
        default:
        // do nothing
      }

      if (typeof nodeConfig.testUrl === 'string') {
        config.push(`server_check_url=${nodeConfig['testUrl']}`)
      }

      config.push(`tag=${nodeConfig.nodeName}`)

      // istanbul ignore next
      if (
        nodeConfig.wsHeaders &&
        Object.keys(nodeConfig.wsHeaders).length > 1
      ) {
        logger.warn(
          `Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
        )
      }

      return [nodeConfig.nodeName, `vmess=${config.join(', ')}`]
    }

    case NodeTypeEnum.Shadowsocks: {
      const config = [
        `${nodeConfig.hostname}:${nodeConfig.port}`,
        ...pickAndFormatStringList(nodeConfig, ['method', 'password']),
        ...(nodeConfig.obfs && ['http', 'tls'].includes(nodeConfig.obfs)
          ? [`obfs=${nodeConfig.obfs}`, `obfs-host=${nodeConfig.obfsHost}`]
          : []),
        ...(nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)
          ? [
              `obfs=${nodeConfig.obfs}`,
              `obfs-host=${nodeConfig.obfsHost || nodeConfig.hostname}`,
              `obfs-uri=${nodeConfig.obfsUri || '/'}`,
            ]
          : []),
        ...(nodeConfig.udpRelay ? [`udp-relay=true`] : []),
        ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
      ]

      if (nodeConfig.obfs === 'wss') {
        if (nodeConfig.skipCertVerify) {
          config.push('tls-verification=false')
        } else {
          config.push('tls-verification=true')
        }

        if (nodeConfig.tls13) {
          config.push('tls13=true')
        }
      }

      // istanbul ignore next
      if (
        nodeConfig.wsHeaders &&
        Object.keys(_.omit(nodeConfig.wsHeaders, ['host'])).length > 0
      ) {
        logger.warn(
          `Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
        )
      }

      if (typeof nodeConfig.testUrl === 'string') {
        config.push(`server_check_url=${nodeConfig['testUrl']}`)
      }

      config.push(`tag=${nodeConfig.nodeName}`)

      return [nodeConfig.nodeName, `shadowsocks=${config.join(', ')}`]
    }

    case NodeTypeEnum.Shadowsocksr: {
      const config = [
        `${nodeConfig.hostname}:${nodeConfig.port}`,
        ...pickAndFormatStringList(nodeConfig, ['method', 'password']),
        `ssr-protocol=${nodeConfig.protocol}`,
        `ssr-protocol-param=${nodeConfig.protoparam}`,
        `obfs=${nodeConfig.obfs}`,
        `obfs-host=${nodeConfig.obfsparam}`,
        ...(nodeConfig.udpRelay ? [`udp-relay=true`] : []),
        ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
        ...(typeof nodeConfig.testUrl === 'string'
          ? [`server_check_url=${nodeConfig.testUrl}`]
          : []),
        `tag=${nodeConfig.nodeName}`,
      ].join(', ')

      return [nodeConfig.nodeName, `shadowsocks=${config}`]
    }

    case NodeTypeEnum.HTTP:
    case NodeTypeEnum.HTTPS: {
      const config = [
        `${nodeConfig.hostname}:${nodeConfig.port}`,
        ...pickAndFormatStringList(nodeConfig, ['username', 'password']),
        ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
      ]

      if (nodeConfig.type === NodeTypeEnum.HTTPS) {
        config.push(
          'over-tls=true',
          `tls-verification=${nodeConfig.skipCertVerify !== true}`,
          ...(nodeConfig.tls13 ? [`tls13=${nodeConfig.tls13}`] : []),
        )
      }

      if (typeof nodeConfig.testUrl === 'string') {
        config.push(`server_check_url=${nodeConfig['testUrl']}`)
      }

      config.push(`tag=${nodeConfig.nodeName}`)

      return [nodeConfig.nodeName, `http=${config.join(', ')}`]
    }

    case NodeTypeEnum.Trojan: {
      const config = [
        `${nodeConfig.hostname}:${nodeConfig.port}`,
        ...pickAndFormatStringList(nodeConfig, ['password']),
        `tls-verification=${nodeConfig.skipCertVerify !== true}`,
        ...(nodeConfig.tfo ? [`fast-open=${nodeConfig.tfo}`] : []),
        ...(nodeConfig.udpRelay ? [`udp-relay=true`] : []),
        ...(nodeConfig.tls13 ? [`tls13=${nodeConfig.tls13}`] : []),
      ]

      if (nodeConfig.network === 'ws') {
        /**
         * The obfs field is only supported with websocket over tls for trojan. When using websocket over
         * tls you should not set over-tls and tls-host options anymore, instead set obfs=wss and
         * obfs-host options.
         */
        config.push('obfs=wss')

        if (nodeConfig.wsPath) {
          config.push(`obfs-uri=${nodeConfig.wsPath}`)
        }

        const hostHeader = nodeConfig?.wsHeaders?.host
        const sni = nodeConfig.sni

        if (sni) {
          config.push(`obfs-host=${sni}`)
        } else if (hostHeader) {
          config.push(`obfs-host=${hostHeader}`)
        }

        if (sni && hostHeader) {
          logger.warn(
            `Quantumult X 不支持同时定义 sni 和 wsHeaders.host，配置以 sni 为准，节点 ${nodeConfig.nodeName} 可能不可用`,
          )
        }

        if (nodeConfig?.wsHeaders) {
          // istanbul ignore next
          if (Object.keys(_.omit(nodeConfig.wsHeaders, ['host'])).length > 0) {
            logger.warn(
              `Quantumult X 不支持自定义额外的 Header 字段，节点 ${nodeConfig.nodeName} 可能不可用`,
            )
          }
        }
      } else {
        config.push('over-tls=true')

        if (nodeConfig.sni) {
          config.push(`tls-host=${nodeConfig.sni}`)
        }
      }

      if (typeof nodeConfig.testUrl === 'string') {
        config.push(`server_check_url=${nodeConfig['testUrl']}`)
      }

      config.push(`tag=${nodeConfig.nodeName}`)

      return [nodeConfig.nodeName, `trojan=${config.join(', ')}`]
    }

    // istanbul ignore next
    default:
      logger.warn(
        `不支持为 QuantumultX 生成 ${(nodeConfig as any).type} 的节点，节点 ${
          (nodeConfig as any).nodeName
        } 会被省略`,
      )
      return void 0
  }
}
