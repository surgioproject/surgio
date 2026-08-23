import { logger as defaultLogger } from '@surgio/logger'

import {
  NodeTypeEnum,
  type AnyTLSNodeConfig,
  type HttpNodeConfig,
  type HttpsNodeConfig,
  type Hysteria2NodeConfig,
  type PossibleNodeConfigType,
  type ShadowsocksNodeConfig,
  type Socks5NodeConfig,
  type TrojanNodeConfig,
  type TuicNodeConfig,
  type VlessNodeConfig,
  type VmessNodeConfig,
  type WireguardNodeConfig,
} from '../types.js'
import { fromBase64, fromUrlSafeBase64 } from '../utils/portable.js'
import { parseSSUri } from '../utils/ss.js'
import {
  AnyTLSNodeConfigValidator,
  HttpNodeConfigValidator,
  HttpsNodeConfigValidator,
  Hysteria2NodeConfigValidator,
  ShadowsocksNodeConfigValidator,
  Socks5NodeConfigValidator,
  TrojanNodeConfigValidator,
  TuicNodeConfigValidator,
  VlessNodeConfigValidator,
  VmessNodeConfigValidator,
  WireguardNodeConfigValidator,
} from '../validators/index.js'

import type { Logger } from '@surgio/logger'

const STANDARD_SCHEMES = new Set([
  'vmess',
  'ss',
  'socks',
  'socks4',
  'socks5',
  'vless',
  'trojan',
  'hysteria2',
  'hy2',
  'tuic',
  'wireguard',
  'anytls',
  'v2rayn',
])

const INTERNAL_CONFIG_TYPES: Record<number, string> = {
  1: 'vmess',
  3: 'shadowsocks',
  4: 'socks',
  5: 'vless',
  6: 'trojan',
  7: 'hysteria2',
  8: 'tuic',
  9: 'wireguard',
  10: 'http',
  11: 'anytls',
  12: 'naive',
  13: 'outbound',
  101: 'policygroup',
  102: 'proxychain',
}

export interface ParseV2rayNSubscriptionOptions {
  readonly isCompatibleMode?: boolean
  readonly skipCertVerify?: boolean
  readonly udpRelay?: boolean
  readonly tls13?: boolean
  readonly allowedNodeTypes?: ReadonlySet<NodeTypeEnum>
  readonly logger?: Logger
}

type CommonParseOptions = Required<
  Pick<ParseV2rayNSubscriptionOptions, 'skipCertVerify' | 'udpRelay' | 'tls13'>
> & {
  readonly isCompatibleMode?: boolean
  readonly logger: Logger
}

const decodeURIComponentSafe = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const decodeName = (url: URL): string =>
  decodeURIComponentSafe(url.hash.replace(/^#/, ''))

const parseBoolean = (value: string | null | undefined): boolean =>
  value === '1' || value?.toLowerCase() === 'true'

const splitList = (
  value: string | null | undefined,
): [string, ...string[]] | undefined => {
  const list = value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return list?.length ? (list as [string, ...string[]]) : undefined
}

const getScheme = (value: string): string =>
  value.slice(0, Math.max(0, value.indexOf('://'))).toLowerCase()

const getKnownLineCount = (value: string): number =>
  value
    .split(/\r?\n/)
    .map((item) => getScheme(item.trim()))
    .filter((scheme) => STANDARD_SCHEMES.has(scheme)).length

const unwrapSubscription = (body: string): string => {
  const plain = body.replace(/^\uFEFF/, '').trim()
  const decoded = fromBase64(plain)
    .replace(/^\uFEFF/, '')
    .trim()
  return getKnownLineCount(decoded) > getKnownLineCount(plain) ? decoded : plain
}

const getUrl = (value: string): URL => {
  try {
    return new URL(value)
  } catch (error) {
    throw new Error(`无效的 ${getScheme(value) || '未知'} 节点地址`, {
      cause: error,
    })
  }
}

const getCredentials = (url: URL): [string, string] => [
  decodeURIComponentSafe(url.username),
  decodeURIComponentSafe(url.password),
]

const applyTlsOptions = <
  T extends {
    sni?: string
    alpn?: [string, ...string[]]
    skipCertVerify?: boolean
    tls13?: boolean
    clientFingerprint?: string
    serverCertFingerprintSha256?: string
  },
>(
  node: T,
  url: URL,
  options: CommonParseOptions,
): void => {
  const query = url.searchParams
  const alpn = splitList(query.get('alpn'))
  const insecure =
    parseBoolean(query.get('allowInsecure')) ||
    parseBoolean(query.get('allow_insecure')) ||
    parseBoolean(query.get('insecure'))

  const sni = query.get('sni') || query.get('peer')
  if (sni) node.sni = sni
  if (alpn) node.alpn = alpn as [string, ...string[]]
  if (query.get('fp')) node.clientFingerprint = query.get('fp')!
  if (query.get('pinSHA256')) {
    node.serverCertFingerprintSha256 = query.get('pinSHA256')!
  }
  if (insecure || options.skipCertVerify) node.skipCertVerify = true
  if (options.tls13) node.tls13 = true
}

const applyTransport = (
  node: VmessNodeConfig | VlessNodeConfig,
  url: URL,
): void => {
  const query = url.searchParams
  const requestedNetwork = (query.get('type') || 'tcp').toLowerCase()
  const network = requestedNetwork === 'raw' ? 'tcp' : requestedNetwork
  const path = query.get('path') || '/'
  const host = query.get('host') || ''

  switch (network) {
    case 'tcp':
      if (query.get('headerType') === 'http') {
        node.network = 'http'
        node.httpOpts = {
          path: [path],
          method: 'GET',
          ...(host ? { headers: { Host: host } } : null),
        }
      } else {
        node.network = 'tcp'
      }
      break
    case 'ws':
      node.network = 'ws'
      node.wsOpts = {
        path,
        ...(host ? { headers: { Host: host } } : null),
      }
      break
    case 'http':
    case 'h2':
      node.network = 'h2'
      node.h2Opts = {
        path,
        ...(splitList(host) ? { host: splitList(host) } : null),
      }
      break
    case 'grpc':
      node.network = 'grpc'
      node.grpcOpts = {
        serviceName: query.get('serviceName') || path.replace(/^\//, ''),
      }
      break
    case 'httpupgrade':
      node.network = 'httpupgrade'
      node.httpUpgradeOpts = {
        path,
        ...(host ? { host } : null),
      }
      break
    case 'quic':
      node.network = 'quic'
      node.quicOpts = {}
      break
    case 'xhttp':
      if (node.type !== NodeTypeEnum.Vless) {
        throw new Error('VMess 节点模型暂不支持 xhttp 传输')
      }
      node.network = 'xhttp'
      node.xhttpOpts = {
        path,
        ...(host ? { host } : null),
        ...(query.get('mode') ? { mode: query.get('mode') } : null),
        ...(query.get('extra') ? { extra: query.get('extra') } : null),
      }
      break
    default:
      throw new Error(`节点模型暂不支持 ${requestedNetwork} 传输`)
  }
}

const parseVmessUrl = (
  value: string,
  options: CommonParseOptions,
): VmessNodeConfig | undefined => {
  const payload = value.slice('vmess://'.length)
  if (!payload.includes('@')) {
    return parseVmessJsonConfig(fromBase64(payload), options)
  }

  const url = getUrl(value)
  const [uuid] = getCredentials(url)
  const node: VmessNodeConfig = {
    type: NodeTypeEnum.Vmess,
    nodeName: decodeName(url),
    hostname: url.hostname,
    port: url.port,
    uuid,
    alterId: url.searchParams.get('aid') || '0',
    method: (url.searchParams.get('scy') ||
      'auto') as VmessNodeConfig['method'],
    network: 'tcp',
    udpRelay: options.udpRelay,
    tls: url.searchParams.get('security') === 'tls',
  }
  applyTransport(node, url)
  if (node.tls) applyTlsOptions(node, url, options)
  return node
}

const parseSocksUrl = (
  value: string,
  options: CommonParseOptions,
): Socks5NodeConfig => {
  const url = getUrl(value)
  if (url.protocol === 'socks4:') {
    throw new Error('Surgio 节点模型不支持 SOCKS4')
  }
  let [username, password] = getCredentials(url)
  if (username && !password) {
    const decoded = fromUrlSafeBase64(username)
    const colonIndex = decoded.indexOf(':')
    if (colonIndex >= 0) {
      username = decoded.slice(0, colonIndex)
      password = decoded.slice(colonIndex + 1)
    }
  }
  const security = url.searchParams.get('security') || 'none'
  if (!['none', 'tls'].includes(security)) {
    throw new Error(`不支持 SOCKS security=${security}`)
  }
  const tls = security === 'tls'
  const node: Socks5NodeConfig = {
    type: NodeTypeEnum.Socks5,
    nodeName: decodeName(url),
    hostname: url.hostname,
    port: url.port,
    ...(username ? { username } : null),
    ...(password ? { password } : null),
    udpRelay: options.udpRelay,
    tls,
  }
  if (tls) applyTlsOptions(node, url, options)
  return node
}

const parseVlessUrl = (
  value: string,
  options: CommonParseOptions,
): VlessNodeConfig => {
  const url = getUrl(value)
  const [uuid] = getCredentials(url)
  const security = url.searchParams.get('security') || 'none'
  const node: VlessNodeConfig = {
    type: NodeTypeEnum.Vless,
    nodeName: decodeName(url),
    hostname: url.hostname,
    port: url.port,
    method: 'none',
    uuid,
    encryption: url.searchParams.get('encryption') || 'none',
    flow: url.searchParams.get('flow') || undefined,
    network: 'tcp',
    udpRelay: options.udpRelay,
  }
  applyTransport(node, url)
  applyTlsOptions(node, url, options)

  if (security === 'reality') {
    const publicKey = url.searchParams.get('pbk')
    if (!publicKey) throw new Error('VLESS Reality 节点缺少 pbk')
    node.realityOpts = {
      publicKey,
      shortId: url.searchParams.get('sid') || undefined,
      spiderX: url.searchParams.get('spx') || undefined,
    }
  } else if (security !== 'tls' && security !== 'none') {
    throw new Error(`不支持 VLESS security=${security}`)
  }
  return node
}

const parseTrojanUrl = (
  value: string,
  options: CommonParseOptions,
): TrojanNodeConfig => {
  const url = getUrl(value)
  const [password] = getCredentials(url)
  const network = (url.searchParams.get('type') || 'tcp').toLowerCase()
  if (!['tcp', 'raw', 'ws'].includes(network)) {
    throw new Error(`Trojan 节点模型暂不支持 ${network} 传输`)
  }
  const host = url.searchParams.get('host')
  const node: TrojanNodeConfig = {
    type: NodeTypeEnum.Trojan,
    nodeName: decodeName(url),
    hostname: url.hostname,
    port: url.port,
    password,
    udpRelay: options.udpRelay,
    network: network === 'ws' ? 'ws' : 'tcp',
    ...(network === 'ws'
      ? {
          wsPath: url.searchParams.get('path') || '/',
          ...(host ? { wsHeaders: { Host: host } } : null),
        }
      : null),
  }
  applyTlsOptions(node, url, options)
  return node
}

const parseHysteria2Url = (
  value: string,
  options: CommonParseOptions,
): Hysteria2NodeConfig => {
  const url = getUrl(value)
  const [username, urlPassword] = getCredentials(url)
  const password = urlPassword || username
  const obfs = url.searchParams.get('obfs')
  if (obfs && obfs !== 'salamander') {
    throw new Error(`Hysteria2 节点模型暂不支持 ${obfs} 混淆`)
  }
  const node: Hysteria2NodeConfig = {
    type: NodeTypeEnum.Hysteria2,
    nodeName: decodeName(url),
    hostname: url.hostname,
    port: url.port,
    password,
    udpRelay: options.udpRelay,
    ...(url.searchParams.get('mport')
      ? { portHopping: url.searchParams.get('mport')! }
      : null),
    ...(obfs === 'salamander'
      ? {
          obfs,
          obfsPassword: url.searchParams.get('obfs-password') || undefined,
        }
      : null),
  }
  applyTlsOptions(node, url, options)
  return node
}

const parseTuicUrl = (
  value: string,
  options: CommonParseOptions,
): TuicNodeConfig => {
  const url = getUrl(value)
  const [uuid, password] = getCredentials(url)
  const congestionControl = url.searchParams.get('congestion_control')
  const node: TuicNodeConfig = password
    ? {
        type: NodeTypeEnum.Tuic,
        nodeName: decodeName(url),
        hostname: url.hostname,
        port: url.port,
        uuid,
        password,
        version: 5,
        ...(congestionControl ? { congestionControl } : null),
      }
    : {
        type: NodeTypeEnum.Tuic,
        nodeName: decodeName(url),
        hostname: url.hostname,
        port: url.port,
        token: uuid,
        ...(congestionControl ? { congestionControl } : null),
      }
  applyTlsOptions(node, url, options)
  return node
}

const stripCidr = (value: string): string => value.replace(/\/.+$/, '')

const parseWireguardUrl = (value: string): WireguardNodeConfig => {
  const url = getUrl(value)
  const [privateKey] = getCredentials(url)
  const addresses = splitList(url.searchParams.get('address')) ?? []
  const selfIp = addresses.find((address) => !address.includes(':'))
  if (!selfIp) throw new Error('WireGuard 节点缺少 IPv4 address')
  const publicKey = url.searchParams.get('publickey')
  if (!publicKey) throw new Error('WireGuard 节点缺少 publickey')
  const reservedBits = splitList(url.searchParams.get('reserved'))?.map(Number)
  return {
    type: NodeTypeEnum.Wireguard,
    nodeName: decodeName(url),
    selfIp: stripCidr(selfIp),
    ...(addresses.find((address) => address.includes(':'))
      ? {
          selfIpV6: stripCidr(
            addresses.find((address) => address.includes(':'))!,
          ),
        }
      : null),
    privateKey,
    ...(url.searchParams.get('mtu')
      ? { mtu: Number(url.searchParams.get('mtu')) }
      : null),
    peers: [
      {
        publicKey,
        endpoint: `${url.hostname.includes(':') ? `[${url.hostname}]` : url.hostname}:${url.port}`,
        ...(url.searchParams.get('presharedkey')
          ? { presharedKey: url.searchParams.get('presharedkey')! }
          : null),
        ...(reservedBits ? { reservedBits } : null),
      },
    ],
  }
}

const parseAnyTlsUrl = (
  value: string,
  options: CommonParseOptions,
): AnyTLSNodeConfig => {
  const url = getUrl(value)
  const [password] = getCredentials(url)
  const node: AnyTLSNodeConfig = {
    type: NodeTypeEnum.AnyTLS,
    nodeName: decodeName(url),
    hostname: url.hostname,
    port: url.port,
    password,
    udpRelay: options.udpRelay,
  }
  applyTlsOptions(node, url, options)
  const publicKey = url.searchParams.get('pbk')
  if (publicKey) {
    node.realityOpts = {
      publicKey,
      shortId: url.searchParams.get('sid') || undefined,
    }
  }
  return node
}

const getObjectValue = (
  object: Record<string, unknown>,
  ...names: string[]
): unknown => {
  const entries = Object.entries(object)
  for (const name of names) {
    const entry = entries.find(
      ([key]) => key.toLowerCase() === name.toLowerCase(),
    )
    if (entry) return entry[1]
  }
  return undefined
}

const getStringValue = (
  object: Record<string, unknown>,
  ...names: string[]
): string => {
  const value = getObjectValue(object, ...names)
  return value === undefined || value === null ? '' : String(value)
}

const getNumberValue = (
  object: Record<string, unknown>,
  ...names: string[]
): number => Number(getStringValue(object, ...names))

const encodeUserInfo = (value: string): string => encodeURIComponent(value)

const getRecordValue = (
  object: Record<string, unknown>,
  ...names: string[]
): Record<string, unknown> => {
  const value = getObjectValue(object, ...names)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

const formatUrlHostname = (hostname: string): string =>
  hostname.includes(':') ? `[${hostname}]` : hostname

const parseInternalUrl = (
  value: string,
  options: CommonParseOptions,
): PossibleNodeConfigType | undefined => {
  const match = /^v2rayn:\/\/([^/]+)\/(.+)$/i.exec(value)
  if (!match) throw new Error('无效的 v2rayn 内部节点地址')
  const pathType = match[1].toLowerCase()
  const profile = JSON.parse(fromUrlSafeBase64(match[2])) as Record<
    string,
    unknown
  >
  if (getNumberValue(profile, 'ConfigVersion') !== 4) {
    throw new Error('不支持的 v2rayN 内部配置版本')
  }
  const numericType = getNumberValue(profile, 'ConfigType')
  const type = INTERNAL_CONFIG_TYPES[numericType] || pathType
  const name = getStringValue(profile, 'Remarks', 'Name')
  const hostname = getStringValue(profile, 'Address', 'Hostname')
  const port = getNumberValue(profile, 'Port')
  const username = getStringValue(profile, 'Username')
  const password = getStringValue(profile, 'Password')
  const protocolExtra = getRecordValue(
    profile,
    'ProtoExtraObj',
    'ProtocolExtraObj',
    'ProtoExtra',
    'ProtocolExtra',
  )
  const transportExtra = getRecordValue(
    profile,
    'TransportExtraObj',
    'TransportExtra',
  )
  const network = getStringValue(profile, 'Network') || 'tcp'
  const streamSecurity = getStringValue(profile, 'StreamSecurity')
  const sni = getStringValue(profile, 'Sni')
  const query = new URLSearchParams({
    type: network,
    ...(streamSecurity ? { security: streamSecurity } : null),
    ...(sni ? { sni } : null),
  })
  const queryFields: ReadonlyArray<
    readonly [string, Record<string, unknown>, string]
  > = [
    ['alpn', profile, 'Alpn'],
    ['fp', profile, 'Fingerprint'],
    ['pbk', profile, 'PublicKey'],
    ['sid', profile, 'ShortId'],
    ['spx', profile, 'SpiderX'],
    ['pinSHA256', profile, 'CertSha'],
    ['host', transportExtra, 'Host'],
    ['path', transportExtra, 'Path'],
    ['headerType', transportExtra, 'RawHeaderType'],
    ['serviceName', transportExtra, 'GrpcServiceName'],
    ['authority', transportExtra, 'GrpcAuthority'],
    ['mode', transportExtra, 'XhttpMode'],
    ['extra', transportExtra, 'XhttpExtra'],
  ]
  for (const [queryName, source, fieldName] of queryFields) {
    const fieldValue = getStringValue(source, fieldName)
    if (fieldValue) query.set(queryName, fieldValue)
  }
  const congestionControl = getStringValue(protocolExtra, 'CongestionControl')
  if (congestionControl) {
    query.set('congestion_control', congestionControl)
  }
  if (parseBoolean(getStringValue(profile, 'AllowInsecure'))) {
    query.set('allowInsecure', '1')
  }
  const hash = encodeURIComponent(name)
  const urlHostname = formatUrlHostname(hostname)

  switch (type) {
    case 'vmess':
      return parseVmessJsonConfig(
        JSON.stringify({
          v: '2',
          ps: name,
          add: hostname,
          port,
          id: password,
          aid: getStringValue(protocolExtra, 'AlterId') || '0',
          scy: getStringValue(protocolExtra, 'VmessSecurity') || 'auto',
          net: network,
          type: getStringValue(transportExtra, 'RawHeaderType') || 'none',
          host: getStringValue(transportExtra, 'Host'),
          path:
            getStringValue(transportExtra, 'GrpcServiceName') ||
            getStringValue(transportExtra, 'Path'),
          tls: streamSecurity,
          sni,
          alpn: getStringValue(profile, 'Alpn'),
          fp: getStringValue(profile, 'Fingerprint'),
          allowInsecure: getStringValue(profile, 'AllowInsecure'),
          pinSHA256: getStringValue(profile, 'CertSha'),
        }),
        { ...options, isCompatibleMode: true },
      )
    case 'shadowsocks':
    case 'ss':
      return {
        type: NodeTypeEnum.Shadowsocks,
        nodeName: name,
        hostname,
        port,
        method: getStringValue(protocolExtra, 'SsMethod'),
        password,
        udpRelay: options.udpRelay,
        skipCertVerify: options.skipCertVerify,
        tls13: options.tls13,
      } as ShadowsocksNodeConfig
    case 'socks':
      return parseSocksUrl(
        `socks://${encodeUserInfo(username)}:${encodeUserInfo(password)}@${urlHostname}:${port}#${hash}`,
        options,
      )
    case 'vless': {
      const encryption =
        getStringValue(protocolExtra, 'VlessEncryption') || 'none'
      const flow = getStringValue(protocolExtra, 'Flow')
      query.set('encryption', encryption)
      if (flow) query.set('flow', flow)
      return parseVlessUrl(
        `vless://${encodeUserInfo(password)}@${urlHostname}:${port}?${query}#${hash}`,
        options,
      )
    }
    case 'trojan':
      return parseTrojanUrl(
        `trojan://${encodeUserInfo(password)}@${urlHostname}:${port}?${query}#${hash}`,
        options,
      )
    case 'hysteria2':
    case 'hy2': {
      const obfsPassword = getStringValue(protocolExtra, 'SalamanderPass')
      const ports = getStringValue(protocolExtra, 'Ports')
      if (obfsPassword) {
        query.set('obfs', 'salamander')
        query.set('obfs-password', obfsPassword)
      }
      if (ports) query.set('mport', ports)
      const node = parseHysteria2Url(
        `hysteria2://${encodeUserInfo(password)}@${urlHostname}:${port}?${query}#${hash}`,
        options,
      )
      const uploadBandwidth = getNumberValue(protocolExtra, 'UpMbps')
      const downloadBandwidth = getNumberValue(protocolExtra, 'DownMbps')
      if (uploadBandwidth > 0) node.uploadBandwidth = uploadBandwidth
      if (downloadBandwidth > 0) node.downloadBandwidth = downloadBandwidth
      return node
    }
    case 'tuic':
      return parseTuicUrl(
        `tuic://${encodeUserInfo(username)}:${encodeUserInfo(password)}@${urlHostname}:${port}?${query}#${hash}`,
        options,
      )
    case 'wireguard': {
      const wireguardQuery = new URLSearchParams({
        publickey: getStringValue(protocolExtra, 'WgPublicKey', 'PublicKey'),
        address:
          getStringValue(protocolExtra, 'WgInterfaceAddress', 'Address') ||
          '172.16.0.2/32',
        ...(getStringValue(protocolExtra, 'WgPresharedKey', 'PresharedKey')
          ? {
              presharedkey: getStringValue(
                protocolExtra,
                'WgPresharedKey',
                'PresharedKey',
              ),
            }
          : null),
        ...(getStringValue(protocolExtra, 'WgReserved', 'Reserved')
          ? {
              reserved: getStringValue(protocolExtra, 'WgReserved', 'Reserved'),
            }
          : null),
        ...(getStringValue(protocolExtra, 'WgMtu', 'Mtu')
          ? { mtu: getStringValue(protocolExtra, 'WgMtu', 'Mtu') }
          : null),
      })
      return parseWireguardUrl(
        `wireguard://${encodeUserInfo(password)}@${urlHostname}:${port}?${wireguardQuery}#${hash}`,
      )
    }
    case 'http': {
      const tls = streamSecurity === 'tls'
      const credentials = {
        ...(username ? { username } : null),
        ...(password ? { password } : null),
      }
      if (tls) {
        const node: HttpsNodeConfig = {
          type: NodeTypeEnum.HTTPS,
          nodeName: name,
          hostname,
          port,
          ...credentials,
        }
        applyTlsOptions(
          node,
          new URL(`https://${urlHostname}?${query}`),
          options,
        )
        return node
      }
      const node: HttpNodeConfig = {
        type: NodeTypeEnum.HTTP,
        nodeName: name,
        hostname,
        port,
        ...credentials,
      }
      return node
    }
    case 'anytls':
      return parseAnyTlsUrl(
        `anytls://${encodeUserInfo(password)}@${urlHostname}:${port}?${query}#${hash}`,
        options,
      )
    case 'naive':
    case 'outbound':
    case 'policygroup':
    case 'proxychain':
      options.logger.warn(
        `v2rayN 内部类型 ${type} 不能映射为 Surgio 节点，已省略。`,
      )
      return undefined
    default:
      throw new Error(`不支持 v2rayN 内部类型 ${type}`)
  }
}

const parseStandardUrl = (
  value: string,
  options: CommonParseOptions,
): PossibleNodeConfigType | undefined => {
  switch (getScheme(value)) {
    case 'vmess':
      return parseVmessUrl(value, options)
    case 'ss':
      return {
        ...parseSSUri(value, options.logger),
        udpRelay: options.udpRelay,
        skipCertVerify: options.skipCertVerify,
        tls13: options.tls13,
      }
    case 'socks':
    case 'socks4':
    case 'socks5':
      return parseSocksUrl(value, options)
    case 'vless':
      return parseVlessUrl(value, options)
    case 'trojan':
      return parseTrojanUrl(value, options)
    case 'hysteria2':
    case 'hy2':
      return parseHysteria2Url(value, options)
    case 'tuic':
      return parseTuicUrl(value, options)
    case 'wireguard':
      return parseWireguardUrl(value)
    case 'anytls':
      return parseAnyTlsUrl(value, options)
    case 'v2rayn':
      return parseInternalUrl(value, options)
    default:
      return undefined
  }
}

const validateNode = (node: PossibleNodeConfigType): PossibleNodeConfigType => {
  switch (node.type) {
    case NodeTypeEnum.Vmess:
      return VmessNodeConfigValidator.parse(node)
    case NodeTypeEnum.Shadowsocks:
      return ShadowsocksNodeConfigValidator.parse(node)
    case NodeTypeEnum.Socks5:
      return Socks5NodeConfigValidator.parse(node)
    case NodeTypeEnum.Vless:
      return VlessNodeConfigValidator.parse(node)
    case NodeTypeEnum.Trojan:
      return TrojanNodeConfigValidator.parse(node)
    case NodeTypeEnum.Hysteria2:
      return Hysteria2NodeConfigValidator.parse(node)
    case NodeTypeEnum.Tuic:
      return TuicNodeConfigValidator.parse(node)
    case NodeTypeEnum.Wireguard:
      return WireguardNodeConfigValidator.parse(node)
    case NodeTypeEnum.AnyTLS:
      return AnyTLSNodeConfigValidator.parse(node)
    case NodeTypeEnum.HTTP:
      return HttpNodeConfigValidator.parse(node)
    case NodeTypeEnum.HTTPS:
      return HttpsNodeConfigValidator.parse(node)
    default:
      return node
  }
}

export const parseV2rayNSubscription = (
  body: string,
  options: ParseV2rayNSubscriptionOptions = {},
): PossibleNodeConfigType[] => {
  const runtimeLogger = options.logger ?? defaultLogger
  const parseOptions: CommonParseOptions = {
    isCompatibleMode: options.isCompatibleMode,
    skipCertVerify: options.skipCertVerify === true,
    udpRelay: options.udpRelay === true,
    tls13: options.tls13 === true,
    logger: runtimeLogger,
  }
  const result: PossibleNodeConfigType[] = []

  for (const line of unwrapSubscription(body)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)) {
    const scheme = getScheme(line)
    if (!STANDARD_SCHEMES.has(scheme)) {
      runtimeLogger.warn(
        `不支持读取 V2rayN 订阅中的 ${scheme || '未知'} 节点，该节点会被省略。`,
      )
      continue
    }

    try {
      const parsedNode = parseStandardUrl(line, parseOptions)
      const node = parsedNode ? validateNode(parsedNode) : undefined
      if (
        node &&
        (!options.allowedNodeTypes || options.allowedNodeTypes.has(node.type))
      ) {
        result.push(node)
      }
    } catch (error) {
      runtimeLogger.warn(
        `无法解析 V2rayN 订阅中的 ${scheme} 节点，该节点会被省略。`,
        error,
      )
    }
  }

  return result
}

const parseVmessJsonConfig = (
  json: string,
  options: CommonParseOptions,
): VmessNodeConfig | undefined => {
  const config = JSON.parse(json) as Record<string, unknown>
  const nodeName = getStringValue(config, 'ps')

  if (!options.isCompatibleMode && getNumberValue(config, 'v') !== 2) {
    throw new Error(
      `该节点 ${nodeName} 可能不是一个有效的 V2rayN 节点。请参考 https://url.royli.dev/Qtrci 进行排查，或者将解析模式改为兼容模式`,
    )
  }

  const network = getStringValue(config, 'net') || 'tcp'
  const headerType = getStringValue(config, 'type') || 'none'
  if (!['none', 'http'].includes(headerType)) {
    options.logger.warn(
      `不支持读取 type 类型为 ${headerType} 的 Vmess 节点，节点 ${nodeName} 会被省略。`,
    )
    return undefined
  }

  const query = new URLSearchParams({
    type: network,
    headerType,
    path: getStringValue(config, 'path'),
    host: getStringValue(config, 'host'),
  })
  const tls = getStringValue(config, 'tls') === 'tls'
  if (tls) query.set('security', 'tls')
  if (getStringValue(config, 'sni'))
    query.set('sni', getStringValue(config, 'sni'))
  if (getStringValue(config, 'alpn'))
    query.set('alpn', getStringValue(config, 'alpn'))
  if (getStringValue(config, 'fp'))
    query.set('fp', getStringValue(config, 'fp'))
  if (getStringValue(config, 'pinSHA256')) {
    query.set('pinSHA256', getStringValue(config, 'pinSHA256'))
  }
  if (parseBoolean(getStringValue(config, 'allowInsecure'))) {
    query.set('allowInsecure', '1')
  }

  const node: VmessNodeConfig = {
    type: NodeTypeEnum.Vmess,
    nodeName,
    hostname: getStringValue(config, 'add'),
    port: getObjectValue(config, 'port') as string | number,
    method: (getStringValue(config, 'scy') ||
      'auto') as VmessNodeConfig['method'],
    uuid: getStringValue(config, 'id'),
    alterId: getStringValue(config, 'aid') || '0',
    network: 'tcp',
    udpRelay: options.udpRelay,
    tls,
  }

  try {
    applyTransport(node, new URL(`vmess://example.invalid?${query}`))
  } catch {
    options.logger.warn(
      `不支持读取 network 类型为 ${network} 的 Vmess 节点，节点 ${nodeName} 会被省略。`,
    )
    return undefined
  }

  if (tls) {
    applyTlsOptions(node, new URL(`vmess://example.invalid?${query}`), options)
  }
  return node
}

export const parseJSONConfig = (
  json: string,
  isCompatibleMode?: boolean,
  skipCertVerify?: boolean,
  udpRelay?: boolean,
  tls13?: boolean,
  runtimeLogger: Logger = defaultLogger,
): VmessNodeConfig | undefined =>
  parseVmessJsonConfig(json, {
    isCompatibleMode,
    skipCertVerify: skipCertVerify === true,
    udpRelay: udpRelay === true,
    tls13: tls13 === true,
    logger: runtimeLogger,
  })
