import { logger as defaultLogger } from '@surgio/logger'

import {
  OBFS_UA,
  SURFBOARD_SUPPORTED_VMESS_NETWORK,
} from '../constant/index.js'
import { applyFilter } from '../filters/index.js'
import { NodeTypeEnum } from '../types.js'

import type { Logger } from '@surgio/logger'
import type {
  NodeFilterType,
  PossibleNodeConfigType,
  SortedNodeFilterType,
} from '../types.js'
import type { FormatterOptions } from '../runtime/types.js'

const shadowsocksMethods = new Set([
  'aes-128-gcm',
  'aes-192-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  'none',
])

class UnsupportedSurfboardNode extends Error {}

// Surfboard documents quote wrapping, but not JSON/backslash escapes.
function quoteValue(value: string | number | boolean): string {
  const text = String(value)
  if (/[\r\n]/.test(text)) {
    throw new UnsupportedSurfboardNode('参数包含换行')
  }
  if (!/[,;#\s'"\\]/.test(text)) return text
  if (!text.includes('"')) return `"${text}"`
  if (!text.includes("'")) return `'${text}'`
  throw new UnsupportedSurfboardNode('参数同时包含单双引号，无法安全序列化')
}

export const getSurfboardExtendHeaders = (
  wsHeaders: Record<string, string>,
): string =>
  Object.entries(wsHeaders)
    .map(([key, value]) => `${key}:${value}`)
    .join('|')

interface SurfboardNode {
  /** 节点原名，用于日志。 */
  nodeName: string
  /** 输出用的名称，必要时带引号。 */
  name: string
  proxy: string
  wireguard?: string
}

function formatNodes(
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter: NodeFilterType | SortedNodeFilterType | undefined,
  options: FormatterOptions,
): SurfboardNode[] {
  const logger = options.logger ?? defaultLogger
  return applyFilter(list, filter).flatMap((node) => {
    try {
      return [formatNode(node, logger)]
    } catch (error) {
      if (!(error instanceof UnsupportedSurfboardNode)) throw error
      logger.warn(`Surfboard ${error.message}，节点 ${node.nodeName} 会被省略`)
      return []
    }
  })
}

/** @see https://getsurfboard.com/docs/ai-profile-guide/reference/ */
export const getSurfboardNodes = (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string => {
  const logger = options.logger ?? defaultLogger

  return formatNodes(list, filter, options)
    .map((node) => {
      if (node.wireguard !== undefined) {
        logger.info(
          `请配合使用 getSurfboardWireguardNodes 生成 ${node.nodeName} 节点配置`,
        )
      }

      return node.proxy
    })
    .join('\n')
}

export const getSurfboardNodeNames = (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string =>
  formatNodes(list, filter, options)
    .map((node) => node.name)
    .join(', ')

export const getSurfboardWireguardNodes = (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string =>
  formatNodes(list, filter, options)
    .flatMap((node) => (node.wireguard === undefined ? [] : [node.wireguard]))
    .join('\n\n')

function formatNode(
  node: PossibleNodeConfigType,
  logger: Logger,
): SurfboardNode {
  if (/[\r\n=]/.test(node.nodeName)) {
    throw new UnsupportedSurfboardNode('节点名称包含换行或等号')
  }
  const name = quoteValue(node.nodeName)
  const params: string[] = []
  const add = (key: string, value: string | number | boolean | undefined) => {
    if (value !== undefined) params.push(`${key}=${quoteValue(value)}`)
  }
  const addTls = (tlsNode: {
    sni?: string
    skipCertVerify?: boolean
    serverCertFingerprintSha256?: string
  }) => {
    add('sni', tlsNode.sni)
    add('skip-cert-verify', tlsNode.skipCertVerify)
    add('server-cert-fingerprint-sha256', tlsNode.serverCertFingerprintSha256)
  }
  const addWs = (
    path: string | undefined,
    headers?: Record<string, string>,
  ) => {
    add('ws', true)
    add('ws-path', path || '/')
    if (headers) add('ws-headers', getSurfboardExtendHeaders(headers))
  }
  const addHopping = () => {
    add('port-hopping', node.portHopping?.replaceAll(',', ';'))
    add('port-hopping-interval', node.portHoppingInterval)
  }
  if (node.shadowTls) {
    throw new UnsupportedSurfboardNode('不支持 Shadow TLS')
  }

  let protocol: string
  let wireguard: string | undefined
  switch (node.type) {
    case NodeTypeEnum.Shadowsocks:
      protocol = 'ss'
      if (!shadowsocksMethods.has(node.method)) {
        throw new UnsupportedSurfboardNode(
          `正式版不支持 Shadowsocks 加密 ${node.method}`,
        )
      }
      if (node.obfs && !['http', 'tls'].includes(node.obfs)) {
        throw new UnsupportedSurfboardNode(
          `不支持 Shadowsocks 混淆 ${node.obfs}`,
        )
      }
      add('encrypt-method', node.method)
      add('password', node.password)
      add('udp-relay', node.udpRelay)
      add('obfs', node.obfs)
      if (node.obfs) {
        add('obfs-host', node.obfsHost)
        add('obfs-uri', node.obfsUri)
      }
      break
    case NodeTypeEnum.HTTP:
    case NodeTypeEnum.HTTPS:
    case NodeTypeEnum.Socks5: {
      const tls =
        node.type === NodeTypeEnum.HTTPS ||
        (node.type === NodeTypeEnum.Socks5 && node.tls === true)
      protocol =
        node.type === NodeTypeEnum.Socks5
          ? tls
            ? 'socks5-tls'
            : 'socks5'
          : node.type
      if (node.type === NodeTypeEnum.Socks5 && node.clientCert !== undefined) {
        throw new UnsupportedSurfboardNode('不支持 client-cert 认证')
      }
      if (node.username !== undefined || node.password !== undefined) {
        params.push(
          quoteValue(node.username ?? ''),
          quoteValue(node.password ?? ''),
        )
      }
      if (node.type === NodeTypeEnum.Socks5) add('udp-relay', node.udpRelay)
      if (tls) addTls(node)
      break
    }
    case NodeTypeEnum.Vmess:
      protocol = 'vmess'
      if (
        !(SURFBOARD_SUPPORTED_VMESS_NETWORK as readonly string[]).includes(
          node.network,
        )
      ) {
        throw new UnsupportedSurfboardNode(
          `不支持 ${node.network} 的 VMess 传输`,
        )
      }
      if (node.method === 'none') {
        throw new UnsupportedSurfboardNode('不支持 VMess 加密 none')
      }
      add('username', node.uuid)
      if (node.method !== 'auto') {
        add(
          'encrypt-method',
          node.method === 'chacha20-poly1305'
            ? 'chacha20-ietf-poly1305'
            : node.method,
        )
      }
      if (node.network === 'ws') {
        addWs(node.wsOpts?.path, {
          'user-agent': OBFS_UA,
          ...node.wsOpts?.headers,
        })
      }
      if (node.tls) {
        add('tls', true)
        addTls(node)
      }
      add('vmess-aead', node.surfboardConfig?.vmessAEAD ?? true)
      add('udp-relay', node.udpRelay)
      break
    case NodeTypeEnum.Trojan:
      protocol = 'trojan'
      add('password', node.password)
      addTls(node)
      if (node.network === 'ws') addWs(node.wsPath, node.wsHeaders)
      add('udp-relay', node.udpRelay)
      break
    case NodeTypeEnum.Hysteria2:
      protocol = 'hysteria2'
      add('password', node.password)
      add('download-bandwidth', node.downloadBandwidth)
      addHopping()
      addTls(node)
      if (node.surfboardConfig?.geckoPassword !== undefined) {
        add('gecko-password', node.surfboardConfig.geckoPassword)
      } else if (node.obfs === 'salamander') {
        if (!node.obfsPassword)
          throw new UnsupportedSurfboardNode('Salamander 缺少密码')
        add('salamander-password', node.obfsPassword)
      }
      add('udp-relay', node.udpRelay)
      break
    case NodeTypeEnum.AnyTLS:
      protocol = 'anytls'
      if (node.realityOpts)
        throw new UnsupportedSurfboardNode('不支持 AnyTLS Reality')
      add('password', node.password)
      addTls(node)
      add('reuse', node.reuse)
      add('udp-relay', node.udpRelay)
      break
    case NodeTypeEnum.Tuic:
      protocol = 'tuic-v5'
      if (!('version' in node) || Number(node.version) !== 5) {
        throw new UnsupportedSurfboardNode('仅支持 TUIC v5')
      }
      if (node.alpn && node.alpn.length !== 1) {
        throw new UnsupportedSurfboardNode('尚未确认 TUIC 多值 ALPN 的配置语法')
      }
      add('uuid', node.uuid)
      add('password', node.password)
      add('alpn', node.alpn?.[0])
      addHopping()
      addTls(node)
      add('udp-relay', node.udpRelay)
      break
    case NodeTypeEnum.Snell: {
      protocol = 'snell'
      const version = Number(node.version ?? 1)
      if (![1, 2, 3, 4, 5].includes(version)) {
        throw new UnsupportedSurfboardNode(`不支持 Snell 版本 ${version}`)
      }
      if (version === 5)
        logger.warn(
          `Surfboard 将 Snell v5 按 v4 处理，节点 ${node.nodeName} 输出 version=4`,
        )
      add('psk', node.psk)
      add(
        'version',
        node.version === undefined ? undefined : Math.min(version, 4),
      )
      add('obfs', node.obfs)
      if (node.obfs) {
        add('obfs-host', node.obfsHost)
        if (node.obfs === 'http') add('obfs-uri', node.obfsUri)
      }
      if (version >= 3) add('udp-relay', node.udpRelay)
      break
    }
    case NodeTypeEnum.Wireguard: {
      protocol = 'wireguard'
      if (/[[\]]/.test(node.nodeName))
        throw new UnsupportedSurfboardNode('WireGuard 段名称包含方括号')
      if (node.underlyingProxy !== undefined)
        throw new UnsupportedSurfboardNode('WireGuard 不支持 underlying-proxy')
      if (node.peers.length !== 1)
        throw new UnsupportedSurfboardNode(
          '尚未确认 WireGuard 多 peer 的配置语法',
        )
      const peer = node.peers[0]
      if (!peer.allowedIps?.trim())
        throw new UnsupportedSurfboardNode('WireGuard 缺少 allowedIps')
      if (node.reservedBits !== undefined || peer.reservedBits !== undefined) {
        throw new UnsupportedSurfboardNode('WireGuard 不支持 reserved bits')
      }
      if (!/^(?:\[[^\]]+\]|[^:]+):\d+$/.test(peer.endpoint)) {
        throw new UnsupportedSurfboardNode(
          'WireGuard endpoint 必须为 host:port，IPv6 地址须加方括号',
        )
      }
      const lines = [
        `[WireGuard ${node.nodeName}]`,
        `private-key=${quoteValue(node.privateKey)}`,
        `self-ip=${quoteValue(node.selfIp)}`,
      ]
      if (node.selfIpV6 !== undefined)
        lines.push(`self-ip-v6=${quoteValue(node.selfIpV6)}`)
      if (node.dnsServers !== undefined)
        lines.push(`dns-server=${node.dnsServers.map(quoteValue).join(', ')}`)
      if (node.mtu !== undefined) lines.push(`mtu=${quoteValue(node.mtu)}`)
      const peerParams = [
        `public-key=${quoteValue(peer.publicKey)}`,
        `allowed-ips=${quoteValue(peer.allowedIps)}`,
        `endpoint=${quoteValue(peer.endpoint)}`,
      ]
      if (peer.presharedKey !== undefined)
        peerParams.push(`preshared-key=${quoteValue(peer.presharedKey)}`)
      if (peer.keepalive !== undefined)
        peerParams.push(`keepalive=${quoteValue(peer.keepalive)}`)
      lines.push(`peer=(${peerParams.join(', ')})`)
      wireguard = lines.join('\n')
      add('section-name', node.nodeName)
      break
    }
    default:
      throw new UnsupportedSurfboardNode(`不支持 ${node.type}`)
  }
  if (node.type !== NodeTypeEnum.Wireguard)
    add('underlying-proxy', node.underlyingProxy)
  add('block-quic', node.blockQuic)
  const address =
    node.type === NodeTypeEnum.Wireguard
      ? []
      : [quoteValue(node.hostname), quoteValue(node.port)]
  return {
    nodeName: node.nodeName,
    name,
    proxy: `${node.nodeName} = ${[protocol, ...address, ...params].join(', ')}`,
    wireguard,
  }
}
