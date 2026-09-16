import { isIPv4, isIPv6 } from 'net'
import { createLogger } from '@surgio/logger'

import { ERR_INVALID_FILTER } from '../constant'
import { applyFilter } from '../filters'
import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types'

import { checkNotNullish, getHeader } from './'

const logger = createLogger({ service: 'surgio:utils:egern' })

export const getEgernNodes = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): ReadonlyArray<Record<string, Record<string, any>>> {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  return applyFilter(list, filter)
    .map(nodeListMapper)
    .filter((item): item is Record<string, Record<string, any>> =>
      checkNotNullish(item),
    )
}

export const getEgernNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
): ReadonlyArray<string> {
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  const nodes = filter ? getEgernNodes(list, filter) : getEgernNodes(list)
  return nodes.map((item) => Object.values(item)[0].name)
}

/**
 * @see https://egernapp.com/docs/configuration/proxies/
 */
function nodeListMapper(
  nodeConfig: PossibleNodeConfigType,
): Record<string, Record<string, any>> | null {
  if (nodeConfig.enable === false) {
    return null
  }

  const config: Record<string, any> = {
    name: nodeConfig.nodeName,
  }

  if ('hostname' in nodeConfig) {
    config.server = nodeConfig.hostname
  }
  if ('port' in nodeConfig) {
    config.port = Number(nodeConfig.port)
  }

  switch (nodeConfig.type) {
    case NodeTypeEnum.Shadowsocks:
      config.method = nodeConfig.method
      config.password = nodeConfig.password
      if (nodeConfig.obfs) {
        if (!['http', 'tls'].includes(nodeConfig.obfs)) {
          return unsupported(nodeConfig, `${nodeConfig.obfs} 混淆`)
        }
        config.obfs = nodeConfig.obfs
        config.obfs_host = nodeConfig.obfsHost
        config.obfs_uri = nodeConfig.obfsUri
      }
      break

    case NodeTypeEnum.Snell:
      config.psk = nodeConfig.psk
      config.version = nodeConfig.version
      config.reuse = nodeConfig.reuse
      config.obfs = nodeConfig.obfs
      config.obfs_host = nodeConfig.obfsHost
      break

    case NodeTypeEnum.Trojan:
      config.password = nodeConfig.password
      setTls(config, nodeConfig)
      if (nodeConfig.network === 'ws') {
        config.websocket = {
          path: nodeConfig.wsPath || '/',
          host: getHeader(nodeConfig.wsHeaders, 'host'),
        }
      }
      break

    case NodeTypeEnum.AnyTLS:
      config.password = nodeConfig.password
      setTls(config, nodeConfig)
      setReality(config, nodeConfig.realityOpts)
      break

    case NodeTypeEnum.Hysteria2:
      config.auth = nodeConfig.password
      config.sni = nodeConfig.sni
      config.obfs = nodeConfig.obfs
      config.obfs_password = nodeConfig.obfsPassword
      config.skip_tls_verify = nodeConfig.skipCertVerify
      config.fingerprint_sha256 = nodeConfig.serverCertFingerprintSha256
      config.port_hopping = nodeConfig.portHopping
      config.port_hopping_interval = nodeConfig.portHoppingInterval
      config.bandwidth = nodeConfig.uploadBandwidth
      break

    case NodeTypeEnum.Tuic:
      if (!('uuid' in nodeConfig)) {
        return unsupported(nodeConfig, 'TUIC v4')
      }
      config.uuid = nodeConfig.uuid
      config.password = nodeConfig.password
      config.alpn = nodeConfig.alpn
      config.sni = nodeConfig.sni
      config.skip_tls_verify = nodeConfig.skipCertVerify
      config.fingerprint_sha256 = nodeConfig.serverCertFingerprintSha256
      config.port_hopping = nodeConfig.portHopping
      config.port_hopping_interval = nodeConfig.portHoppingInterval
      break

    case NodeTypeEnum.Socks5:
      config.username = nodeConfig.username
      config.password = nodeConfig.password
      if (nodeConfig.tls) {
        setTls(config, nodeConfig)
      }
      break

    case NodeTypeEnum.HTTP:
      config.username = nodeConfig.username
      config.password = nodeConfig.password
      config.headers = nodeConfig.headers
      break

    case NodeTypeEnum.HTTPS:
      config.username = nodeConfig.username
      config.password = nodeConfig.password
      config.headers = nodeConfig.headers
      setTls(config, nodeConfig)
      break

    case NodeTypeEnum.Vmess:
    case NodeTypeEnum.Vless:
      config.user_id = nodeConfig.uuid
      if (nodeConfig.type === NodeTypeEnum.Vmess) {
        config.security = nodeConfig.method
      } else {
        config.flow = nodeConfig.flow
      }
      config.transport = getTransport(nodeConfig)
      if (config.transport === null) {
        return null
      }
      break

    case NodeTypeEnum.Wireguard: {
      if (nodeConfig.peers.length !== 1) {
        return unsupported(nodeConfig, '多个 WireGuard peer')
      }
      const peer = nodeConfig.peers[0]
      const endpoint = new URL(`http://${peer.endpoint}`)
      config.server = endpoint.hostname
      config.port = Number(endpoint.port)
      config.private_key = nodeConfig.privateKey
      config.peer_public_key = peer.publicKey
      config.preshared_key = peer.presharedKey
      config.reserved = peer.reservedBits || nodeConfig.reservedBits
      config.local_ipv4 = withCidr(nodeConfig.selfIp)
      config.local_ipv6 = withCidr(nodeConfig.selfIpV6)
      config.dns_servers = nodeConfig.dnsServers
      config.mtu = nodeConfig.mtu
      config.keepalive = peer.keepalive
      break
    }

    default:
      return unsupported(nodeConfig)
  }

  setCommon(config, nodeConfig)
  return { [getEgernType(nodeConfig)]: prune(config) }
}

function getEgernType(nodeConfig: PossibleNodeConfigType): string {
  if (nodeConfig.type === NodeTypeEnum.Socks5 && nodeConfig.tls) {
    return 'socks5_tls'
  }
  return nodeConfig.type
}

function setCommon(
  config: Record<string, any>,
  nodeConfig: PossibleNodeConfigType,
): void {
  if (nodeConfig.tfo !== undefined) {
    config.tfo = nodeConfig.tfo
  }
  if ('udpRelay' in nodeConfig && nodeConfig.udpRelay !== undefined) {
    config.udp_relay = nodeConfig.udpRelay
  }
  if (nodeConfig.blockQuic !== undefined && nodeConfig.blockQuic !== 'auto') {
    config.block_quic = nodeConfig.blockQuic === 'on'
  }
  config.prev_hop = nodeConfig.underlyingProxy
  config.ip_version = nodeConfig.ipVersion
  if (nodeConfig.shadowTls) {
    config.shadow_tls = {
      password: nodeConfig.shadowTls.password,
      sni: nodeConfig.shadowTls.sni,
    }
  }
}

function setTls(config: Record<string, any>, nodeConfig: any): void {
  config.sni = nodeConfig.sni
  config.skip_tls_verify = nodeConfig.skipCertVerify
  config.fingerprint_sha256 = nodeConfig.serverCertFingerprintSha256
}

function setReality(
  config: Record<string, any>,
  realityOpts: { publicKey: string; shortId?: string } | undefined,
): void {
  if (realityOpts) {
    config.reality = {
      public_key: realityOpts.publicKey,
      short_id: realityOpts.shortId,
    }
  }
}

function getTransport(nodeConfig: any): Record<string, any> | undefined | null {
  const secure = nodeConfig.type === NodeTypeEnum.Vless || nodeConfig.tls
  const tlsFields = {
    sni: nodeConfig.sni,
    skip_tls_verify: nodeConfig.skipCertVerify,
    fingerprint_sha256: nodeConfig.serverCertFingerprintSha256,
  }
  setReality(tlsFields, nodeConfig.realityOpts)

  switch (nodeConfig.network) {
    case 'tcp':
      return secure ? { tls: prune(tlsFields) } : undefined
    case 'ws':
      return {
        [secure ? 'wss' : 'ws']: prune({
          path: nodeConfig.wsOpts?.path,
          headers: nodeConfig.wsOpts?.headers,
          ...(secure ? tlsFields : {}),
        }),
      }
    case 'http':
      return {
        http1: prune({
          method: nodeConfig.httpOpts?.method,
          path: nodeConfig.httpOpts?.path?.[0],
          headers: nodeConfig.httpOpts?.headers,
        }),
      }
    case 'h2':
      return {
        http2: prune({
          path: nodeConfig.h2Opts?.path,
          headers: nodeConfig.h2Opts?.host?.[0]
            ? { Host: nodeConfig.h2Opts.host[0] }
            : undefined,
          ...tlsFields,
        }),
      }
    case 'grpc':
      return {
        grpc: prune({
          service_name: nodeConfig.grpcOpts?.serviceName,
          ...tlsFields,
        }),
      }
    default:
      return unsupported(nodeConfig, `${nodeConfig.network} 传输`)
  }
}

function withCidr(address: string | undefined): string | undefined {
  if (!address || address.includes('/')) {
    return address
  }
  if (isIPv4(address)) {
    return `${address}/32`
  }
  if (isIPv6(address)) {
    return `${address}/128`
  }
  return address
}

function unsupported(
  nodeConfig: PossibleNodeConfigType,
  feature: string = nodeConfig.type,
): null {
  logger.warn(`Egern 不支持 ${feature}，节点 ${nodeConfig.nodeName} 会被省略`)
  return null
}

function prune(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [
        key,
        value && typeof value === 'object' && !Array.isArray(value)
          ? prune(value)
          : value,
      ])
      .filter(([, value]) => !isEmptyObject(value)),
  )
}

function isEmptyObject(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  )
}
