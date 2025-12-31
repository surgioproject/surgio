import { createLogger } from '@surgio/logger'
import _ from 'lodash'

import { ERR_INVALID_FILTER } from '../constant'
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types'
import { applyFilter } from '../filters'

import {
  checkNotNullish,
  getHostnameFromHost,
  getPortFromHost,
  pickAndFormatKeys,
} from './index'

const logger = createLogger({ service: 'surgio:utils:clash' })

export const getClashNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
) {
  return applyFilter(list, filter)
    .map((nodeConfig) => {
      const clashNode = nodeListMapper(nodeConfig)

      if (!clashNode) {
        return clashNode
      }

      if (nodeConfig?.clashConfig?.clashCore === 'clash.meta') {
        if (nodeConfig.underlyingProxy) {
          clashNode['dialer-proxy'] = nodeConfig.underlyingProxy
        }
        if (nodeConfig.ipVersion) {
          clashNode['ip-version'] = nodeConfig.ipVersion
        }
        if (nodeConfig.interfaceName) {
          clashNode['interface-name'] = nodeConfig.interfaceName
        }

        if ('multiplex' in nodeConfig && nodeConfig.multiplex) {
          // https://wiki.metacubex.one/config/proxies/sing-mux/#sing-mux
          clashNode.smux = {
            enabled: true,
            protocol: nodeConfig.multiplex.protocol,
            ...(nodeConfig.multiplex.brutal && {
              'brutal-opts': {
                enabled: true,
                up: nodeConfig.multiplex.brutal.upMbps,
                down: nodeConfig.multiplex.brutal.downMbps,
              },
            }),
            ...pickAndFormatKeys(
              nodeConfig.multiplex,
              ['maxConnections', 'minStreams', 'maxStreams', 'padding'],
              {
                keyFormat: 'kebabCase',
              },
            ),
          }
        }
      }

      return clashNode
    })
    .filter((item): item is NonNullable<ReturnType<typeof nodeListMapper>> =>
      checkNotNullish(item),
    )
}

export const getClashNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  prependNodeNames?: ReadonlyArray<string>,
  defaultNodeNames?: ReadonlyArray<string>,
): ReadonlyArray<string> {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  let result: string[] = []

  if (prependNodeNames) {
    result = result.concat(prependNodeNames)
  }

  result = result.concat(getClashNodes(list, filter).map((item) => item.name))

  if (result.length === 0 && defaultNodeNames) {
    result = result.concat(defaultNodeNames)
  }

  return result
}

/**
 * @see https://wiki.metacubex.one/config/proxies/
 * @see https://stash.wiki/proxy-protocols/proxy-types
 */
function nodeListMapper(nodeConfig: PossibleNodeConfigType) {
  const clashConfig = nodeConfig.clashConfig || {}

  switch (nodeConfig.type) {
    case NodeTypeEnum.Shadowsocks:
      // Istanbul ignore next
      if (nodeConfig.shadowTls && !clashConfig.enableShadowTls) {
        logger.warn(
          `尚未开启 Clash 的 shadow-tls 支持，节点 ${nodeConfig.nodeName} 将被忽略。如需开启，请在配置文件中设置 clashConfig.enableShadowTls 为 true。`,
        )
        return null
      }

      // Istanbul ignore next
      if (nodeConfig.shadowTls && nodeConfig.obfs) {
        logger.warn(
          `Clash 不支持同时开启 shadow-tls 和 obfs，节点 ${nodeConfig.nodeName} 将被忽略。`,
        )
        return null
      }

      return {
        type: 'ss',
        cipher: nodeConfig.method,
        name: nodeConfig.nodeName,
        password: nodeConfig.password,
        port: nodeConfig.port,
        server: nodeConfig.hostname,
        udp: nodeConfig.udpRelay === true,
        ...(nodeConfig.obfs && ['tls', 'http'].includes(nodeConfig.obfs)
          ? {
              plugin: 'obfs',
              'plugin-opts': {
                mode: nodeConfig.obfs,
                host: nodeConfig.obfsHost,
              },
            }
          : null),
        ...(nodeConfig.obfs && ['ws', 'wss'].includes(nodeConfig.obfs)
          ? {
              plugin: 'v2ray-plugin',
              'plugin-opts': {
                mode: 'websocket',
                tls: nodeConfig.obfs === 'wss',
                ...(typeof nodeConfig.skipCertVerify === 'boolean' &&
                nodeConfig.obfs === 'wss'
                  ? {
                      'skip-cert-verify': nodeConfig.skipCertVerify,
                    }
                  : null),
                host: nodeConfig.obfsHost,
                path: nodeConfig.obfsUri || '/',
                mux:
                  typeof nodeConfig.mux === 'boolean' ? nodeConfig.mux : false,
                headers: _.omit(nodeConfig.wsHeaders || {}, ['host']),
              },
            }
          : null),
        ...(nodeConfig.shadowTls && nodeConfig.clashConfig?.enableShadowTls
          ? {
              plugin: 'shadow-tls',
              'client-fingerprint': 'chrome',
              'plugin-opts': {
                password: nodeConfig.shadowTls.password,
                ...(nodeConfig.shadowTls.version
                  ? { version: nodeConfig.shadowTls.version }
                  : null),
                ...(nodeConfig.shadowTls.sni
                  ? { host: nodeConfig.shadowTls.sni }
                  : null),
              },
            }
          : null),
      } as const

    case NodeTypeEnum.Vless:
    case NodeTypeEnum.Vmess: {
      if (nodeConfig.type === 'vless' && !clashConfig.enableVless) {
        logger.warn(
          `尚未开启 Clash 的 VLESS 支持，节点 ${nodeConfig.nodeName} 会被省略。如需开启，请在配置文件中设置 clashConfig.enableVless 为 true。`,
        )
        return null
      }

      const vmessNode: Record<string, any> = {
        type: nodeConfig.type,
        cipher: nodeConfig.method,
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        udp: nodeConfig.udpRelay === true,
        uuid: nodeConfig.uuid,
        network: nodeConfig.network || 'tcp',
      }

      if (nodeConfig.type === NodeTypeEnum.Vmess) {
        vmessNode.alterId = nodeConfig.alterId || '0'
      }

      if (nodeConfig.type === NodeTypeEnum.Vless) {
        vmessNode.flow = nodeConfig.flow

        if (nodeConfig.realityOpts) {
          vmessNode['reality-opts'] = {
            'public-key': nodeConfig.realityOpts.publicKey,
          }

          if (nodeConfig.realityOpts.shortId) {
            vmessNode['reality-opts']['short-id'] =
              nodeConfig.realityOpts.shortId
          }
          if (nodeConfig.realityOpts.spiderX) {
            vmessNode['reality-opts']['spider-x'] =
              nodeConfig.realityOpts.spiderX
          }
        }
      }

      if (
        (nodeConfig.type === NodeTypeEnum.Vmess && nodeConfig.tls) ||
        nodeConfig.type === NodeTypeEnum.Vless
      ) {
        vmessNode.tls = true

        if (nodeConfig.skipCertVerify) {
          vmessNode['skip-cert-verify'] = nodeConfig.skipCertVerify
        }
        if (clashConfig.clashCore === 'clash' && nodeConfig.sni) {
          vmessNode.servername = nodeConfig.sni
        }
        if (clashConfig.clashCore === 'stash' && nodeConfig.sni) {
          vmessNode.sni = nodeConfig.sni
          vmessNode.servername = nodeConfig.sni
        }
        if (clashConfig.clashCore === 'clash.meta' && nodeConfig.sni) {
          vmessNode.servername = nodeConfig.sni
        }
        if (nodeConfig.clientFingerprint) {
          vmessNode['client-fingerprint'] = nodeConfig.clientFingerprint
        }
      }

      switch (nodeConfig.network) {
        case 'tcp':
          break

        case 'ws':
          vmessNode['ws-opts'] = nodeConfig.wsOpts
          break

        case 'h2':
          vmessNode['h2-opts'] = nodeConfig.h2Opts
          break

        case 'http':
          vmessNode['http-opts'] = {
            ...nodeConfig.httpOpts,
            headers: resolveVmessHttpHeadersFromSurgioConfig(
              nodeConfig.httpOpts?.headers || {},
            ),
          }
          break

        case 'grpc':
          if (nodeConfig.grpcOpts) {
            vmessNode['grpc-opts'] = {
              'grpc-service-name': nodeConfig.grpcOpts.serviceName,
            }
          }
          break
      }

      return vmessNode
    }

    case NodeTypeEnum.Shadowsocksr:
      return {
        type: 'ssr',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        password: nodeConfig.password,
        obfs: nodeConfig.obfs,
        protocol: nodeConfig.protocol,
        cipher: nodeConfig.method,
        'obfs-param': nodeConfig.obfsparam ?? '',
        'protocol-param': nodeConfig.protoparam ?? '',
        udp: nodeConfig.udpRelay === true,
      } as const

    case NodeTypeEnum.Snell:
      // Istanbul ignore next
      if (Number(nodeConfig.version) >= 4) {
        logger.warn(
          `Clash 尚不支持 Snell v${nodeConfig.version}，节点 ${nodeConfig.nodeName} 会被省略。`,
        )
        return null
      }

      return {
        type: 'snell',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        psk: nodeConfig.psk,
        'obfs-opts': {
          mode: nodeConfig.obfs,
          ...(nodeConfig.obfsHost
            ? {
                host: nodeConfig.obfsHost,
              }
            : null),
        },
        ...(nodeConfig.version
          ? {
              version: nodeConfig.version,
            }
          : null),
      } as const

    case NodeTypeEnum.HTTPS:
      return {
        type: 'http',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        username: nodeConfig.username /* istanbul ignore next */ || '',
        password: nodeConfig.password /* istanbul ignore next */ || '',
        tls: true,
        'skip-cert-verify': nodeConfig.skipCertVerify === true,
      } as const

    case NodeTypeEnum.HTTP:
      return {
        type: 'http',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        username: nodeConfig.username /* istanbul ignore next */ || '',
        password: nodeConfig.password /* istanbul ignore next */ || '',
      } as const

    case NodeTypeEnum.Trojan:
      return {
        type: 'trojan',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        password: nodeConfig.password,
        ...(nodeConfig.udpRelay ? { udp: nodeConfig.udpRelay } : null),
        ...(nodeConfig.alpn ? { alpn: nodeConfig.alpn } : null),
        ...(nodeConfig.sni ? { sni: nodeConfig.sni } : null),
        ...(nodeConfig.serverCertFingerprintSha256
          ? { fingerprint: nodeConfig.serverCertFingerprintSha256 }
          : null),
        'skip-cert-verify': nodeConfig.skipCertVerify === true,
        ...(nodeConfig.network === 'ws'
          ? {
              network: 'ws',
              'ws-opts': {
                path: nodeConfig.wsPath || '/',
                ...nodeConfig.wsHeaders,
              },
            }
          : null),
      } as const

    case NodeTypeEnum.Socks5:
      return {
        type: 'socks5',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        ...(nodeConfig.username ? { username: nodeConfig.username } : null),
        ...(nodeConfig.password ? { password: nodeConfig.password } : null),
        ...(typeof nodeConfig.tls === 'boolean'
          ? { tls: nodeConfig.tls }
          : null),
        ...(typeof nodeConfig.skipCertVerify === 'boolean'
          ? { 'skip-cert-verify': nodeConfig.skipCertVerify }
          : null),
        ...(typeof nodeConfig.udpRelay === 'boolean'
          ? { udp: nodeConfig.udpRelay }
          : null),
      } as const

    case NodeTypeEnum.Tuic:
      // Istanbul ignore next
      if (!clashConfig.enableTuic) {
        logger.warn(
          `尚未开启 Clash 的 Tuic 支持，节点 ${nodeConfig.nodeName} 会被省略。如需开启，请在配置文件中设置 clashConfig.enableTuic 为 true。`,
        )
        return null
      }

      // Istanbul ignore next
      if (nodeConfig.alpn && !nodeConfig.alpn.length) {
        logger.warn(
          `节点 ${nodeConfig.nodeName} 的 alpn 为空。Stash 客户端不支持 ALPN 为空，默认的 ALPN 为 h3。`,
        )
      }

      if ('version' in nodeConfig && Number(nodeConfig.version) >= 5) {
        return {
          type: 'tuic',
          name: nodeConfig.nodeName,
          server: nodeConfig.hostname,
          port: nodeConfig.port,
          udp: true,
          ...pickAndFormatKeys(
            nodeConfig,
            ['password', 'uuid', 'sni', 'skipCertVerify', 'version'],
            {
              keyFormat: 'kebabCase',
            },
          ),
          ...(clashConfig.clashCore === 'stash' && nodeConfig.portHopping
            ? {
                ports: nodeConfig.portHopping.replaceAll(';', ','),
              }
            : null),
          ...(clashConfig.clashCore === 'stash' &&
          nodeConfig.portHoppingInterval
            ? {
                'hop-interval': nodeConfig.portHoppingInterval,
              }
            : null),
          ...(nodeConfig.alpn ? { alpn: nodeConfig.alpn } : null),
        } as const
      }

      return {
        type: 'tuic',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        udp: true,
        ...pickAndFormatKeys(
          nodeConfig,
          ['token', 'sni', 'skipCertVerify', 'version'],
          {
            keyFormat: 'kebabCase',
          },
        ),
        ...(clashConfig.clashCore === 'stash' && nodeConfig.portHopping
          ? {
              ports: nodeConfig.portHopping.replaceAll(';', ','),
            }
          : null),
        ...(clashConfig.clashCore === 'stash' && nodeConfig.portHoppingInterval
          ? {
              'hop-interval': nodeConfig.portHoppingInterval,
            }
          : null),
        ...(nodeConfig.alpn ? { alpn: nodeConfig.alpn } : null),
      } as const

    case NodeTypeEnum.Hysteria2:
      // Istanbul ignore next
      if (!clashConfig.enableHysteria2) {
        logger.warn(
          `尚未开启 Clash 的 Hysteria2 支持，节点 ${nodeConfig.nodeName} 会被省略。如需开启，请在配置文件中设置 clashConfig.enableHysteria2 为 true。`,
        )
        return null
      }

      return {
        type: 'hysteria2',
        name: nodeConfig.nodeName,
        server: nodeConfig.hostname,
        port: nodeConfig.port,
        [clashConfig.clashCore === 'stash' ? 'auth' : 'password']:
          nodeConfig.password,
        up: nodeConfig.uploadBandwidth || 0,
        down: nodeConfig.downloadBandwidth || 0,
        ...pickAndFormatKeys(
          nodeConfig,
          ['obfs', 'obfsPassword', 'sni', 'skipCertVerify'],
          {
            keyFormat: 'kebabCase',
          },
        ),
        ...((clashConfig.clashCore === 'stash' ||
          clashConfig.clashCore === 'clash.meta') &&
        nodeConfig.portHopping
          ? {
              ports: nodeConfig.portHopping.replaceAll(';', ','),
            }
          : null),
        ...((clashConfig.clashCore === 'stash' ||
          clashConfig.clashCore === 'clash.meta') &&
        nodeConfig.portHoppingInterval
          ? {
              'hop-interval': nodeConfig.portHoppingInterval,
            }
          : null),
        ...(nodeConfig.alpn ? { alpn: nodeConfig.alpn } : null),
      } as const

    case NodeTypeEnum.Wireguard:
      // istanbul ignore next
      if (nodeConfig.peers.length > 1) {
        logger.warn(
          `节点 ${nodeConfig.nodeName} 有多个 WireGuard Peer，然而 Stash 或 Clash 仅支持一个 Peer，因此只会使用第一个 Peer。`,
        )
      }

      return {
        type: 'wireguard',
        name: nodeConfig.nodeName,
        'private-key': nodeConfig.privateKey,
        ip: nodeConfig.selfIp,
        ...(nodeConfig.selfIpV6 ? { ipv6: nodeConfig.selfIpV6 } : null),
        ...(nodeConfig.mtu ? { mtu: nodeConfig.mtu } : null),
        ...(nodeConfig.dnsServers ? { dns: nodeConfig.dnsServers } : null),
        udp: true,

        // Peer
        server: getHostnameFromHost(nodeConfig.peers[0].endpoint),
        port: getPortFromHost(nodeConfig.peers[0].endpoint),
        'public-key': nodeConfig.peers[0].publicKey,
        ...(nodeConfig.peers[0].presharedKey
          ? nodeConfig?.clashConfig?.clashCore === 'clash.meta'
            ? { 'pre-shared-key': nodeConfig.peers[0].presharedKey }
            : { 'preshared-key': nodeConfig.peers[0].presharedKey }
          : null),
        ...(nodeConfig.peers[0].reservedBits
          ? {
              reserved: nodeConfig.peers[0].reservedBits,
            }
          : null),
      } as const

    // istanbul ignore next
    default:
      logger.warn(
        `不支持为 Clash 生成 ${(nodeConfig as any).type} 的节点，节点 ${
          (nodeConfig as any).nodeName
        } 会被省略`,
      )
      return null
  }
}

function resolveVmessHttpHeadersFromSurgioConfig(
  headers: Record<string, string>,
): Record<string, string[]> {
  return Object.keys(headers).reduce((acc, key) => {
    acc[key] = [headers[key]]
    return acc
  }, {} as Record<string, string[]>)
}
