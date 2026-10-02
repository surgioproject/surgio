import { logger as defaultLogger } from '@surgio/logger'

import { ERR_INVALID_FILTER } from '../constant/index.js'
import { applyFilter } from '../filters/index.js'
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
  VlessNodeConfig,
  VmessNodeConfig,
} from '../types.js'

import { formatIpVersion } from './ip-version.js'
import { checkNotNullish, getHeader } from './portable.js'

import type { Logger } from '@surgio/logger'
import type { FormatterOptions } from '../runtime/types.js'

type EgernConfig = Record<string, any>
type EgernNode = Record<string, EgernConfig>
type Reject = (feature: string) => null
type NodeOf<T extends NodeTypeEnum> = Extract<
  PossibleNodeConfigType,
  { type: T }
>
type ProtocolMapper<T extends NodeTypeEnum> = (
  nodeConfig: NodeOf<T>,
  reject: Reject,
) => EgernConfig | null

const SNELL_MAX_VERSION = 5

const TFO_TYPES = new Set<NodeTypeEnum>([
  NodeTypeEnum.Shadowsocks,
  NodeTypeEnum.Snell,
  NodeTypeEnum.Trojan,
  NodeTypeEnum.AnyTLS,
  NodeTypeEnum.Socks5,
  NodeTypeEnum.HTTP,
  NodeTypeEnum.HTTPS,
  NodeTypeEnum.Vmess,
  NodeTypeEnum.Vless,
])

const UDP_RELAY_TYPES = new Set<NodeTypeEnum>([
  NodeTypeEnum.Shadowsocks,
  NodeTypeEnum.Snell,
  NodeTypeEnum.Trojan,
  NodeTypeEnum.AnyTLS,
  NodeTypeEnum.Socks5,
  NodeTypeEnum.Vmess,
  NodeTypeEnum.Vless,
])

const SHADOW_TLS_TYPES = new Set<NodeTypeEnum>([
  NodeTypeEnum.Shadowsocks,
  NodeTypeEnum.Trojan,
  NodeTypeEnum.AnyTLS,
  NodeTypeEnum.Socks5,
  NodeTypeEnum.HTTP,
  NodeTypeEnum.HTTPS,
  NodeTypeEnum.Vmess,
  NodeTypeEnum.Vless,
])

const NO_BLOCK_QUIC_TYPES = new Set<NodeTypeEnum>([
  NodeTypeEnum.HTTP,
  NodeTypeEnum.HTTPS,
])

export const getEgernNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): ReadonlyArray<EgernNode> {
  const logger = options.logger ?? defaultLogger
  return applyFilter(list, filter)
    .map((nodeConfig) => nodeListMapper(nodeConfig, logger))
    .filter((item): item is EgernNode => checkNotNullish(item))
}

export const getEgernNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): ReadonlyArray<string> {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  return getEgernNodes(list, filter, options).map(
    (item) => Object.values(item)[0].name,
  )
}

/**
 * @see https://egernapp.com/docs/configuration/proxies
 */
function nodeListMapper(
  nodeConfig: PossibleNodeConfigType,
  logger: Logger,
): EgernNode | null {
  const mapper = protocolMappers[nodeConfig.type] as
    ProtocolMapper<typeof nodeConfig.type> | undefined
  if (!mapper) {
    logger.warn(
      `不支持为 Egern 生成 ${nodeConfig.type} 的节点，节点 ${nodeConfig.nodeName} 会被忽略`,
    )
    return null
  }

  const reject: Reject = (feature) => {
    logger.warn(`Egern 不支持 ${feature}，节点 ${nodeConfig.nodeName} 会被忽略`)
    return null
  }
  const protocolConfig = mapper(nodeConfig, reject)
  const commonConfig =
    protocolConfig && getCommonConfig(nodeConfig, logger, reject)
  if (!protocolConfig || !commonConfig) {
    return null
  }

  const serverConfig =
    'hostname' in nodeConfig && 'port' in nodeConfig
      ? { server: nodeConfig.hostname, port: Number(nodeConfig.port) }
      : {}
  return {
    [getEgernType(nodeConfig)]: prune({
      name: nodeConfig.nodeName,
      ...serverConfig,
      ...protocolConfig,
      ...commonConfig,
    }),
  }
}

const protocolMappers: { [T in NodeTypeEnum]?: ProtocolMapper<T> } = {
  [NodeTypeEnum.Shadowsocks]: (nodeConfig, reject) => {
    if (nodeConfig.obfs && !['http', 'tls'].includes(nodeConfig.obfs)) {
      return reject(`Shadowsocks 的 ${nodeConfig.obfs} 混淆`)
    }
    return {
      method: nodeConfig.method,
      password: nodeConfig.password,
      ...(nodeConfig.obfs && {
        obfs: nodeConfig.obfs,
        obfs_host: nodeConfig.obfsHost,
        obfs_uri: nodeConfig.obfsUri,
      }),
    }
  },

  [NodeTypeEnum.Snell]: (nodeConfig, reject) => {
    const version =
      nodeConfig.version === undefined ? undefined : Number(nodeConfig.version)
    if (version !== undefined && version > SNELL_MAX_VERSION) {
      return reject(`Snell v${version}`)
    }
    return {
      psk: nodeConfig.psk,
      version,
      reuse: nodeConfig.reuse,
      obfs: nodeConfig.obfs,
      obfs_host: nodeConfig.obfs ? nodeConfig.obfsHost : undefined,
    }
  },

  [NodeTypeEnum.Trojan]: (nodeConfig) => ({
    password: nodeConfig.password,
    ...getTlsConfig(nodeConfig),
    websocket:
      nodeConfig.network === 'ws'
        ? {
            path: nodeConfig.wsPath || '/',
            host: getHeader(nodeConfig.wsHeaders, 'host'),
          }
        : undefined,
  }),

  [NodeTypeEnum.AnyTLS]: (nodeConfig) => ({
    password: nodeConfig.password,
    ...getTlsConfig(nodeConfig),
    // Egern 的 AnyTLS 未设置时默认跳过证书校验，这里保持 Surgio 默认校验的语义
    skip_tls_verify: nodeConfig.skipCertVerify ?? false,
    reality: getRealityConfig(nodeConfig.realityOpts),
  }),

  [NodeTypeEnum.Hysteria2]: (nodeConfig) => ({
    auth: nodeConfig.password,
    ...getTlsConfig(nodeConfig),
    obfs: nodeConfig.obfs,
    obfs_password: nodeConfig.obfsPassword,
    ...getPortHoppingConfig(nodeConfig),
    bandwidth: nodeConfig.uploadBandwidth,
  }),

  [NodeTypeEnum.Tuic]: (nodeConfig, reject) => {
    if (!('uuid' in nodeConfig)) {
      return reject('TUIC v4')
    }
    return {
      uuid: nodeConfig.uuid,
      password: nodeConfig.password,
      alpn: nodeConfig.alpn,
      ...getTlsConfig(nodeConfig),
      ...getPortHoppingConfig(nodeConfig),
    }
  },

  [NodeTypeEnum.Socks5]: (nodeConfig) => ({
    username: nodeConfig.username,
    password: nodeConfig.password,
    ...(nodeConfig.tls && getTlsConfig(nodeConfig)),
  }),

  [NodeTypeEnum.HTTP]: (nodeConfig) => ({
    username: nodeConfig.username,
    password: nodeConfig.password,
    headers: nodeConfig.headers,
  }),

  [NodeTypeEnum.HTTPS]: (nodeConfig) => ({
    username: nodeConfig.username,
    password: nodeConfig.password,
    headers: nodeConfig.headers,
    ...getTlsConfig(nodeConfig),
  }),

  [NodeTypeEnum.Vmess]: (nodeConfig, reject) => {
    const transport = getTransport(nodeConfig, Boolean(nodeConfig.tls), reject)
    if (transport === null) {
      return null
    }
    return {
      user_id: nodeConfig.uuid,
      security: nodeConfig.method,
      // alterId 大于 0 时服务端使用旧版 MD5 认证
      legacy: Number(nodeConfig.alterId) > 0 || undefined,
      transport,
    }
  },

  [NodeTypeEnum.Vless]: (nodeConfig, reject) => {
    if (nodeConfig.encryption && nodeConfig.encryption !== 'none') {
      return reject(`VLESS encryption=${nodeConfig.encryption}`)
    }
    const transport = getTransport(nodeConfig, true, reject)
    if (transport === null) {
      return null
    }
    return { user_id: nodeConfig.uuid, flow: nodeConfig.flow, transport }
  },

  [NodeTypeEnum.Wireguard]: (nodeConfig, reject) => {
    if (nodeConfig.peers.length > 1) {
      return reject('WireGuard 多 Peer')
    }
    const [peer] = nodeConfig.peers
    return {
      ...parseWireguardEndpoint(peer.endpoint),
      private_key: nodeConfig.privateKey,
      peer_public_key: peer.publicKey,
      preshared_key: peer.presharedKey,
      reserved: peer.reservedBits ?? nodeConfig.reservedBits,
      local_ipv4: `${nodeConfig.selfIp}/32`,
      local_ipv6: nodeConfig.selfIpV6 && `${nodeConfig.selfIpV6}/128`,
      dns_servers: nodeConfig.dnsServers,
      mtu: nodeConfig.mtu,
      keepalive: peer.keepalive,
    }
  },
}

function getEgernType(nodeConfig: PossibleNodeConfigType): string {
  if (nodeConfig.type === NodeTypeEnum.Socks5 && nodeConfig.tls) {
    return 'socks5_tls'
  }
  return nodeConfig.type
}

function getCommonConfig(
  nodeConfig: PossibleNodeConfigType,
  logger: Logger,
  reject: Reject,
): EgernConfig | null {
  const { type } = nodeConfig
  if (nodeConfig.shadowTls && !SHADOW_TLS_TYPES.has(type)) {
    return reject(`${type} 节点的 ShadowTLS`)
  }
  return {
    tfo: TFO_TYPES.has(type) ? nodeConfig.tfo : undefined,
    udp_relay:
      UDP_RELAY_TYPES.has(type) && 'udpRelay' in nodeConfig
        ? nodeConfig.udpRelay
        : undefined,
    block_quic: NO_BLOCK_QUIC_TYPES.has(type)
      ? undefined
      : getBlockQuic(nodeConfig.blockQuic),
    prev_hop: nodeConfig.underlyingProxy,
    ip_version: formatIpVersion(nodeConfig, 'Egern', logger),
    shadow_tls: nodeConfig.shadowTls && {
      password: nodeConfig.shadowTls.password,
      sni: nodeConfig.shadowTls.sni,
    },
  }
}

function getBlockQuic(blockQuic: string | undefined): boolean | undefined {
  if (blockQuic === 'on') return true
  if (blockQuic === 'off') return false
  return undefined
}

function getTlsConfig(nodeConfig: {
  sni?: string
  skipCertVerify?: boolean
  serverCertFingerprintSha256?: string
}): EgernConfig {
  return {
    sni: nodeConfig.sni,
    skip_tls_verify: nodeConfig.skipCertVerify,
    fingerprint_sha256: nodeConfig.serverCertFingerprintSha256,
  }
}

function getRealityConfig(
  realityOpts: { publicKey: string; shortId?: string } | undefined,
): EgernConfig | undefined {
  return (
    realityOpts && {
      public_key: realityOpts.publicKey,
      short_id: realityOpts.shortId,
    }
  )
}

function getPortHoppingConfig(nodeConfig: {
  portHopping?: string
  portHoppingInterval?: number
}): EgernConfig {
  return {
    // 校验器把逗号改写成了 Surge 使用的分号，Egern 需要逗号
    port_hopping: nodeConfig.portHopping?.replaceAll(';', ','),
    port_hopping_interval: nodeConfig.portHoppingInterval,
  }
}

/**
 * Egern 的 http1 传输不支持 TLS，http2 和 grpc 始终使用 TLS。
 *
 * @see https://egernapp.com/docs/configuration/proxies#vmess-transport
 */
function getTransport(
  nodeConfig: VmessNodeConfig | VlessNodeConfig,
  secure: boolean,
  reject: Reject,
): EgernConfig | undefined | null {
  const { network } = nodeConfig
  const tlsConfig = getTlsConfig(nodeConfig)
  const reality =
    'realityOpts' in nodeConfig
      ? getRealityConfig(nodeConfig.realityOpts)
      : undefined
  if (reality && network !== 'tcp' && network !== 'grpc') {
    return reject(`${network} 传输上的 Reality`)
  }

  switch (network) {
    case 'tcp':
      return secure ? { tls: { ...tlsConfig, reality } } : undefined
    case 'ws': {
      const wsConfig = {
        path: nodeConfig.wsOpts?.path,
        headers: nodeConfig.wsOpts?.headers,
      }
      return secure ? { wss: { ...wsConfig, ...tlsConfig } } : { ws: wsConfig }
    }
    case 'http':
      if (secure) {
        return reject('HTTP 传输的 TLS')
      }
      return {
        http1: {
          method: nodeConfig.httpOpts?.method,
          path: nodeConfig.httpOpts?.path[0],
          headers: nodeConfig.httpOpts?.headers,
        },
      }
    case 'h2':
      return {
        http2: {
          path: nodeConfig.h2Opts?.path,
          headers: nodeConfig.h2Opts?.host && {
            Host: nodeConfig.h2Opts.host[0],
          },
          ...tlsConfig,
        },
      }
    case 'grpc':
      return {
        grpc: {
          service_name: nodeConfig.grpcOpts?.serviceName,
          ...tlsConfig,
          reality,
        },
      }
    default:
      return reject(`${network} 传输`)
  }
}

function parseWireguardEndpoint(endpoint: string): EgernConfig {
  const separatorIndex = endpoint.lastIndexOf(':')
  return {
    server: endpoint.slice(0, separatorIndex).replace(/^\[(.*)\]$/, '$1'),
    port: Number(endpoint.slice(separatorIndex + 1)),
  }
}

// 只剔除空值；保留空对象，例如 `tls: {}` 表示启用 TLS
function prune(config: EgernConfig): EgernConfig {
  return Object.fromEntries(
    Object.entries(config)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [
        key,
        typeof value === 'object' && !Array.isArray(value)
          ? prune(value)
          : value,
      ]),
  )
}
