import { createLogger } from '@surgio/logger'

import { ERR_INVALID_FILTER } from '../constant'
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types'
import { applyFilter } from '../filters'
import { MultiplexValidator, TlsNodeConfigValidator } from '../validators'

import { stringifySip003Options } from './ss'

import {
  checkNotNullish,
  getHostnameFromHost,
  getPortFromHost,
  pickAndFormatKeys,
} from './'

const logger = createLogger({ service: 'surgio:utils:singbox' })

export const getSingboxNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
) {
  return applyFilter(list, filter)
    .flatMap(nodeListMapper)
    .filter((item): item is Record<string, any> => checkNotNullish(item))
}

export const getSingboxNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): ReadonlyArray<string> {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  return getSingboxNodes(list, filter).map((item) => item.tag)
}

const typeMap = {
  [NodeTypeEnum.HTTP]: 'http',
  [NodeTypeEnum.HTTPS]: 'http',
  [NodeTypeEnum.Shadowsocks]: 'shadowsocks',
  [NodeTypeEnum.Vmess]: 'vmess',
  [NodeTypeEnum.Vless]: 'vless',
  [NodeTypeEnum.Trojan]: 'trojan',
  [NodeTypeEnum.Socks5]: 'socks',
  [NodeTypeEnum.Tuic]: 'tuic',
  [NodeTypeEnum.Wireguard]: 'wireguard',
  [NodeTypeEnum.Hysteria2]: 'hysteria2',
} as const

/**
 * @see https://sing-box.sagernet.org/configuration/outbound/
 */
function nodeListMapper(nodeConfig: PossibleNodeConfigType) {
  if (nodeConfig.type in typeMap === false) {
    logger.warn(
      `不支持为 sing-box 生成 ${nodeConfig.type} 的节点，节点 ${nodeConfig.nodeName} 会被忽略`,
    )
    return null
  }
  const node: Record<string, any> = {
    type: typeMap[nodeConfig.type as keyof typeof typeMap],
    tag: nodeConfig.nodeName,
  }
  if ('hostname' in nodeConfig) {
    node.server = nodeConfig.hostname
  }
  if ('port' in nodeConfig) {
    node.server_port = Number(nodeConfig.port)
  }
  if ('udpRelay' in nodeConfig && nodeConfig.udpRelay === false) {
    node.network = 'tcp'
  }

  const setTls = (field: string, v: any) => {
    if (!node.tls) {
      node.tls = { enabled: true }
    }
    node.tls[field] = v
  }

  switch (nodeConfig.type) {
    case NodeTypeEnum.Shadowsocks:
      node.method = nodeConfig.method
      node.password = nodeConfig.password
      if (nodeConfig.obfs) {
        if (['tls', 'http'].includes(nodeConfig.obfs)) {
          node.plugin = 'obfs-local'
          node.plugin_opts = stringifySip003Options(
            prune({
              obfs: nodeConfig.obfs,
              'obfs-host': nodeConfig.obfsHost,
            }),
          )
        }
        if (['ws', 'wss', 'quic'].includes(nodeConfig.obfs)) {
          node.plugin = 'v2ray-plugin'
          node.plugin_opts = stringifySip003Options(
            prune({
              mode: nodeConfig.obfs === 'quic' ? 'quic' : 'websocket',
              tls: ['wss', 'quic'].includes(nodeConfig.obfs),
              host: nodeConfig.obfsHost,
              path: nodeConfig.obfsUri,
              mux: nodeConfig.mux === false ? 0 : null,
            }),
          )
        }
      }
      break

    case NodeTypeEnum.Vless:
    case NodeTypeEnum.Vmess: {
      node.uuid = nodeConfig.uuid
      if (nodeConfig.type === NodeTypeEnum.Vmess) {
        node.security = nodeConfig.method
        if (nodeConfig.alterId) {
          node.alter_id = Number(nodeConfig.alterId)
        }
      }
      if (nodeConfig.type === NodeTypeEnum.Vless) {
        node.flow = nodeConfig.flow
        if (nodeConfig.realityOpts) {
          setTls('utls', {
            enabled: true,
            fingerprint: nodeConfig.clientFingerprint,
          })
          setTls('reality', {
            enabled: true,
            public_key: nodeConfig.realityOpts.publicKey,
            short_id: nodeConfig.realityOpts.shortId,
          })
        }
      }

      switch (nodeConfig.network) {
        case 'http':
          node.transport = {
            type: 'http',
            // host: [],
            path: nodeConfig.httpOpts?.path[0],
            method: nodeConfig.httpOpts?.method,
            headers: normalizeHeaders(nodeConfig.httpOpts?.headers),
            // idle_timeout: '15s',
            // ping_timeout: '15s',
          }
          break

        case 'ws':
          node.transport = {
            type: 'ws',
            path: nodeConfig.wsOpts?.path,
            headers: normalizeHeaders(nodeConfig.wsOpts?.headers),
            // max_early_data: 0,
            // early_data_header_name: '',
          }
          break

        case 'quic':
          node.transport = {
            type: 'quic',
          }
          break

        case 'grpc':
          node.transport = {
            type: 'grpc',
            service_name: nodeConfig.grpcOpts?.serviceName,
            // idle_timeout: '15s',
            // ping_timeout: '15s',
            // permit_without_stream: false,
          }
          break

        case 'httpupgrade':
          node.transport = {
            type: 'httpupgrade',
            host: nodeConfig.httpUpgradeOpts?.host,
            path: nodeConfig.httpUpgradeOpts?.path,
            headers: normalizeHeaders(nodeConfig.httpUpgradeOpts?.headers),
          }
          break

        case 'tcp':
          break

        default:
          logger.warn(
            `sing-box 的 ${nodeConfig.type} 节点不支持 network=${nodeConfig.network}，节点 ${nodeConfig.nodeName} 会被忽略`,
          )
          return null
      }
      break
    }

    case NodeTypeEnum.HTTP:
    case NodeTypeEnum.HTTPS:
      node.username = nodeConfig.username
      node.password = nodeConfig.password
      node.path = nodeConfig.path
      node.headers = normalizeHeaders(nodeConfig.headers)
      if (nodeConfig.type === NodeTypeEnum.HTTPS) {
        setTls('enabled', true)
      }
      break

    case NodeTypeEnum.Trojan:
      node.password = nodeConfig.password
      if (nodeConfig.network) {
        switch (nodeConfig.network) {
          case 'ws':
            node.transport = {
              type: 'ws',
              path: nodeConfig.wsPath,
              headers: normalizeHeaders(nodeConfig.wsHeaders),
              // max_early_data: 0,
              // early_data_header_name: '',
            }
            break

          default:
            logger.warn(
              `sing-box 的 ${nodeConfig.type} 节点不支持 network=${nodeConfig.network}，节点 ${nodeConfig.nodeName} 会被忽略`,
            )
            return null
        }
      }
      break

    case NodeTypeEnum.Socks5:
      node.username = nodeConfig.username
      node.password = nodeConfig.password
      break

    case NodeTypeEnum.Tuic:
      if ('uuid' in nodeConfig === false) {
        logger.warn(
          `sing-box 仅支持 tuic v5，节点 ${nodeConfig.nodeName} 会被忽略`,
        )
        return null
      }
      node.uuid = nodeConfig.uuid
      node.password = nodeConfig.password
      // congestion_control: 'cubic',
      // udp_relay_mode: 'native',
      // udp_over_stream: false,
      // zero_rtt_handshake: false,
      // heartbeat: '10s',
      break

    case NodeTypeEnum.Hysteria2:
      node.up_mbps = nodeConfig.uploadBandwidth
      node.down_mbps = nodeConfig.downloadBandwidth
      node.obfs = {
        type: nodeConfig.obfs,
        password: nodeConfig.obfsPassword,
      }
      node.password = nodeConfig.password
      break

    case NodeTypeEnum.Wireguard:
      // const sample = {
      //   system_interface: false,
      //   gso: false,
      //   interface_name: 'wg0',
      //   local_address: ['10.0.0.2/32'],
      //   private_key: 'YNXtAzepDqRv9H52osJVDQnznT5AM11eCK3ESpwSt04=',
      //   peers: [
      //     {
      //       server: '127.0.0.1',
      //       server_port: 1080,
      //       public_key: 'Z1XXLsKYkYxuiYjJIkRvtIKFepCYHTgON+GwPq7SOV4=',
      //       pre_shared_key: '31aIhAPwktDGpH4JDhA8GNvjFXEf/a6+UaQRyOAiyfM=',
      //       allowed_ips: ['0.0.0.0/0'],
      //       reserved: [0, 0, 0],
      //     },
      //   ],
      //   peer_public_key: 'Z1XXLsKYkYxuiYjJIkRvtIKFepCYHTgON+GwPq7SOV4=',
      //   pre_shared_key: '31aIhAPwktDGpH4JDhA8GNvjFXEf/a6+UaQRyOAiyfM=',
      //   reserved: [0, 0, 0],
      //   workers: 4,
      //   mtu: 1408,
      // }
      node.local_address = [`${nodeConfig.selfIp}/32`]
      if (nodeConfig.selfIpV6) {
        node.local_address.push(`${nodeConfig.selfIpV6}/128`)
      }
      node.private_key = nodeConfig.privateKey
      node.peers = nodeConfig.peers.map((peer) => ({
        server: getHostnameFromHost(peer.endpoint),
        server_port: getPortFromHost(peer.endpoint),
        public_key: peer.publicKey,
        pre_shared_key: peer.presharedKey,
        allowed_ips: peer.allowedIps?.split(',').map((ip) => ip.trim()),
        reserved: peer.reservedBits,
      }))
      node.mtu = nodeConfig.mtu
      break
  }

  if ('tls' in nodeConfig && nodeConfig.tls) {
    setTls('enabled', true)
  }
  const r = TlsNodeConfigValidator.safeParse(nodeConfig)
  if (r.success) {
    const tlsConfig = r.data
    if (tlsConfig.sni) {
      setTls('server_name', tlsConfig.sni)
    }
    if (tlsConfig.skipCertVerify) {
      setTls('insecure', true)
    }
    if (tlsConfig.alpn) {
      setTls('alpn', tlsConfig.alpn)
    }
    if (tlsConfig.tls13) {
      setTls('min_version', '1.3')
    }
    if (tlsConfig.clientFingerprint) {
      setTls('utls', {
        enabled: true,
        fingerprint: tlsConfig.clientFingerprint,
      })
    }
  }
  if ('multiplex' in nodeConfig) {
    const r = MultiplexValidator.safeParse(nodeConfig.multiplex)
    if (r.success) {
      const multiplexConfig = r.data
      node.multiplex = pickAndFormatKeys(
        multiplexConfig,
        ['protocol', 'maxConnections', 'minStreams', 'maxStreams', 'padding'],
        { keyFormat: 'snakeCase' },
      )
      node.multiplex.enabled = true
      if (multiplexConfig.brutal) {
        node.multiplex.brutal = pickAndFormatKeys(
          multiplexConfig.brutal,
          ['upMbps', 'downMbps'],
          { keyFormat: 'snakeCase' },
        )
      }
    }
  }
  if (nodeConfig.tfo) {
    node.tcp_fast_open = true
  }
  if (nodeConfig.mptcp) {
    node.tcp_multi_path = true
  }
  if (nodeConfig.underlyingProxy) {
    node.detour = nodeConfig.underlyingProxy
  }
  if (!nodeConfig.shadowTls) {
    return prune(node)
  }
  const { server, server_port, ..._node } = node
  const tag = `${node.tag}-shadowtls`
  _node.detour = tag
  return [
    prune(_node),
    prune({
      type: 'shadowtls',
      tag: tag,
      server: server,
      server_port: server_port,
      version: nodeConfig.shadowTls.version,
      password: nodeConfig.shadowTls.password,
      tls: {
        enabled: true,
        server_name: nodeConfig.shadowTls.sni,
      },
    }),
  ]
}

function normalizeHeaders(headers: Record<string, string> | undefined) {
  if (!headers) {
    return {}
  }
  return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, [v]]))
}

// delete all undefined / null / [] / {} / '' properties
function prune(obj: Record<string, any>): Record<string, any> {
  const prunedObj: Record<string, any> = {}

  for (const key in obj) {
    const value = obj[key]

    // Check if the property exists and is not null or undefined
    if (value !== null && value !== undefined) {
      // Check if the property is an array
      if (Array.isArray(value)) {
        // Check if the array is empty
        if (value.length > 0) {
          prunedObj[key] = value
        }
      } else if (typeof value === 'object') {
        // Check if the object is empty
        if (Object.keys(value).length > 0) {
          prunedObj[key] = prune(value) // Recursively prune the object
        }
      } else if (typeof value === 'string') {
        // Check if the string is not empty
        if (value.trim().length > 0) {
          prunedObj[key] = value
        }
      } else {
        // Add non-empty string, number, or boolean values
        prunedObj[key] = value
      }
    }
  }

  return prunedObj
}
