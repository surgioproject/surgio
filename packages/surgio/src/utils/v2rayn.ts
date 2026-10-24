import { logger as defaultLogger } from '@surgio/logger'

import { applyFilter } from '../filters/index.js'
import { NodeTypeEnum } from '../types.js'

import { getHeader, toBase64, toUrlSafeBase64 } from './portable.js'
import { stringifySip003Options } from './ss.js'

import type { FormatterOptions } from '../runtime/types.js'
import type {
  NodeFilterType,
  PossibleNodeConfigType,
  SortedNodeFilterType,
  VlessNodeConfig,
  VmessNodeConfig,
} from '../types.js'

interface SerializedNode {
  readonly uri: string
  readonly omittedFields?: readonly string[]
}

interface TlsFields {
  readonly alpn?: readonly string[]
  readonly clientFingerprint?: string
  readonly serverCertFingerprintSha256?: string
  readonly skipCertVerify?: boolean
  readonly sni?: string
  readonly tls13?: boolean
}

const formatHostname = (hostname: string): string =>
  hostname.includes(':') && !hostname.startsWith('[')
    ? `[${hostname}]`
    : hostname

const createUri = (
  scheme: string,
  userInfo: string,
  hostname: string,
  port: string | number,
  query: URLSearchParams,
  nodeName: string,
  encodeUserInfo = true,
): string => {
  const queryString = query.toString()
  return `${scheme}://${encodeUserInfo ? encodeURIComponent(userInfo) : userInfo}@${formatHostname(
    hostname,
  )}:${port}${queryString ? `?${queryString}` : ''}#${encodeURIComponent(
    nodeName,
  )}`
}

const hasValue = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  value !== false &&
  value !== '' &&
  (!Array.isArray(value) || value.length > 0) &&
  (typeof value !== 'object' || Object.keys(value).length > 0)

const addOmittedField = (
  omittedFields: string[],
  field: string,
  value: unknown,
): void => {
  if (hasValue(value)) omittedFields.push(field)
}

const addUnsupportedHeaders = (
  omittedFields: string[],
  field: string,
  headers: Readonly<Record<string, string>> | undefined,
  supportedHeaders: readonly string[] = ['host'],
): void => {
  const supported = new Set(supportedHeaders.map((item) => item.toLowerCase()))
  for (const header of Object.keys(headers ?? {})) {
    if (!supported.has(header.toLowerCase())) {
      omittedFields.push(`${field}.${header}`)
    }
  }
}

const addTlsQuery = (
  query: URLSearchParams,
  node: TlsFields,
  omittedFields: string[],
  options: {
    readonly certificateKey?: string
    readonly fingerprint?: boolean
    readonly insecureKeys?: readonly string[]
    readonly security?: string
  } = {},
): void => {
  if (options.security) query.set('security', options.security)
  if (node.sni) query.set('sni', node.sni)
  if (node.alpn) query.set('alpn', node.alpn.join(','))

  if (node.clientFingerprint) {
    if (options.fingerprint) query.set('fp', node.clientFingerprint)
    else omittedFields.push('clientFingerprint')
  }
  if (node.serverCertFingerprintSha256) {
    if (options.certificateKey) {
      query.set(options.certificateKey, node.serverCertFingerprintSha256)
    } else {
      omittedFields.push('serverCertFingerprintSha256')
    }
  }
  if (node.skipCertVerify) {
    if (options.insecureKeys?.length) {
      for (const key of options.insecureKeys) query.set(key, '1')
    } else {
      omittedFields.push('skipCertVerify')
    }
  }
  addOmittedField(omittedFields, 'tls13', node.tls13)
}

const getTransportQuery = (
  node: VmessNodeConfig | VlessNodeConfig,
  omittedFields: string[],
): URLSearchParams => {
  const query = new URLSearchParams()

  switch (node.network) {
    case 'tcp':
      query.set('type', 'tcp')
      query.set('headerType', 'none')
      break
    case 'http':
      query.set('type', 'tcp')
      query.set('headerType', 'http')
      if (node.httpOpts?.path[0]) query.set('path', node.httpOpts.path[0])
      if (node.httpOpts) {
        const host = getHeader(node.httpOpts.headers, 'host')
        if (host) query.set('host', host)
        if (node.httpOpts.path.length > 1) omittedFields.push('httpOpts.path')
        if (node.httpOpts.method !== 'GET') {
          omittedFields.push('httpOpts.method')
        }
        addUnsupportedHeaders(
          omittedFields,
          'httpOpts.headers',
          node.httpOpts.headers,
        )
      }
      break
    case 'ws':
      query.set('type', 'ws')
      if (node.wsOpts?.path) query.set('path', node.wsOpts.path)
      if (node.wsOpts) {
        const host = getHeader(node.wsOpts.headers, 'host')
        if (host) query.set('host', host)
        addUnsupportedHeaders(
          omittedFields,
          'wsOpts.headers',
          node.wsOpts.headers,
        )
      }
      break
    case 'h2':
      query.set('type', 'h2')
      if (node.h2Opts?.path) query.set('path', node.h2Opts.path)
      if (node.h2Opts?.host) query.set('host', node.h2Opts.host.join(','))
      break
    case 'grpc':
      query.set('type', 'grpc')
      if (node.grpcOpts?.serviceName) {
        query.set('serviceName', node.grpcOpts.serviceName)
      }
      break
    case 'quic':
      query.set('type', 'quic')
      break
    case 'httpupgrade': {
      query.set('type', 'httpupgrade')
      if (node.httpUpgradeOpts?.path) {
        query.set('path', node.httpUpgradeOpts.path)
      }
      if (node.httpUpgradeOpts) {
        const host =
          node.httpUpgradeOpts.host ??
          getHeader(node.httpUpgradeOpts.headers, 'host')
        if (host) query.set('host', host)
        addUnsupportedHeaders(
          omittedFields,
          'httpUpgradeOpts.headers',
          node.httpUpgradeOpts.headers,
        )
      }
      break
    }
    case 'xhttp': {
      query.set('type', 'xhttp')
      if (node.type !== NodeTypeEnum.Vless) break
      const transportOptions = node.xhttpOpts as
        Record<string, unknown> | undefined
      for (const key of ['path', 'host', 'mode', 'extra'] as const) {
        if (typeof transportOptions?.[key] === 'string') {
          query.set(key, transportOptions[key])
        }
      }
      for (const key of Object.keys(transportOptions ?? {})) {
        if (!['path', 'host', 'mode', 'extra'].includes(key)) {
          omittedFields.push(`xhttpOpts.${key}`)
        }
      }
      break
    }
  }

  return query
}

const serializeVmess = (node: VmessNodeConfig): SerializedNode => {
  const omittedFields: string[] = []
  const transport = getTransportQuery(node, omittedFields)
  const output: Record<string, string> = {
    v: '2',
    ps: node.nodeName,
    add: node.hostname,
    port: String(node.port),
    id: node.uuid,
    aid: String(node.alterId ?? 0),
    scy: node.method,
    net: transport.get('type') ?? 'tcp',
    type: transport.get('headerType') ?? 'none',
  }

  if (node.network === 'http') output.net = 'tcp'
  if (node.network === 'grpc') output.path = node.grpcOpts?.serviceName ?? ''
  else if (transport.has('path')) output.path = transport.get('path')!
  if (transport.has('host')) output.host = transport.get('host')!

  if (node.tls) output.tls = 'tls'
  if (node.sni) output.sni = node.sni
  if (node.alpn) output.alpn = node.alpn.join(',')
  if (node.clientFingerprint) output.fp = node.clientFingerprint
  if (node.skipCertVerify) output.insecure = '1'
  if (node.serverCertFingerprintSha256) {
    output.pcs = node.serverCertFingerprintSha256
  }
  addOmittedField(omittedFields, 'tls13', node.tls13)

  return {
    uri: `vmess://${toBase64(JSON.stringify(output))}`,
    omittedFields,
  }
}

const serializeShadowsocks = (
  node: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Shadowsocks }>,
): SerializedNode => {
  const omittedFields: string[] = []
  const query = new URLSearchParams()

  if (node.obfs === 'http' || node.obfs === 'tls') {
    query.set(
      'plugin',
      `obfs-local;${stringifySip003Options({
        obfs: node.obfs,
        'obfs-host': node.obfsHost ?? '',
      })}`,
    )
    addOmittedField(omittedFields, 'obfsUri', node.obfsUri)
  } else if (node.obfs === 'ws' || node.obfs === 'wss') {
    const pluginOptions = stringifySip003Options({
      host: node.obfsHost ?? '',
      mode: 'websocket',
      mux: 0,
      path: node.obfsUri ?? '',
    })
    query.set(
      'plugin',
      `v2ray-plugin;${pluginOptions}${node.obfs === 'wss' ? ';tls' : ''}`,
    )
    addUnsupportedHeaders(omittedFields, 'wsHeaders', node.wsHeaders)
    if (node.mux) omittedFields.push('mux')
  } else {
    addOmittedField(omittedFields, 'obfs', node.obfs)
    addOmittedField(omittedFields, 'obfsHost', node.obfsHost)
    addOmittedField(omittedFields, 'obfsUri', node.obfsUri)
  }

  addOmittedField(omittedFields, 'skipCertVerify', node.skipCertVerify)
  addOmittedField(omittedFields, 'tls13', node.tls13)
  addOmittedField(omittedFields, 'multiplex', node.multiplex)

  const userInfo = toUrlSafeBase64(`${node.method}:${node.password}`)
  return {
    uri: createUri(
      'ss',
      userInfo,
      node.hostname,
      node.port,
      query,
      node.nodeName,
    ),
    omittedFields,
  }
}

const serializeSocks = (
  node: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Socks5 }>,
): SerializedNode => {
  const omittedFields: string[] = []
  const credentials = toUrlSafeBase64(
    `${node.username ?? ''}:${node.password ?? ''}`,
  )
  addOmittedField(omittedFields, 'tls', node.tls)
  addOmittedField(omittedFields, 'sni', node.sni)
  addOmittedField(omittedFields, 'alpn', node.alpn)
  addOmittedField(
    omittedFields,
    'serverCertFingerprintSha256',
    node.serverCertFingerprintSha256,
  )
  addOmittedField(omittedFields, 'clientFingerprint', node.clientFingerprint)
  addOmittedField(omittedFields, 'skipCertVerify', node.skipCertVerify)
  addOmittedField(omittedFields, 'tls13', node.tls13)
  addOmittedField(omittedFields, 'clientCert', node.clientCert)

  return {
    uri: createUri(
      'socks',
      credentials,
      node.hostname,
      node.port,
      new URLSearchParams(),
      node.nodeName,
    ),
    omittedFields,
  }
}

const serializeVless = (node: VlessNodeConfig): SerializedNode => {
  const omittedFields: string[] = []
  const query = getTransportQuery(node, omittedFields)
  query.set('encryption', node.encryption || 'none')
  if (node.flow) query.set('flow', node.flow)

  const security = node.realityOpts ? 'reality' : 'tls'
  addTlsQuery(query, node, omittedFields, {
    certificateKey: 'pcs',
    fingerprint: true,
    security,
  })
  if (node.realityOpts) {
    query.set('pbk', node.realityOpts.publicKey)
    if (node.realityOpts.shortId) query.set('sid', node.realityOpts.shortId)
    if (node.realityOpts.spiderX) query.set('spx', node.realityOpts.spiderX)
  }
  addOmittedField(omittedFields, 'packetEncoding', node.packetEncoding)
  addOmittedField(omittedFields, 'echOpts', node.echOpts)

  return {
    uri: createUri(
      'vless',
      node.uuid,
      node.hostname,
      node.port,
      query,
      node.nodeName,
    ),
    omittedFields,
  }
}

const serializeTrojan = (
  node: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Trojan }>,
): SerializedNode => {
  const omittedFields: string[] = []
  const query = new URLSearchParams()
  query.set('type', node.network === 'ws' ? 'ws' : 'tcp')
  query.set('security', 'tls')
  if (node.network === 'ws') {
    query.set('path', node.wsPath || '/')
    const host = getHeader(node.wsHeaders, 'host')
    if (host) query.set('host', host)
    addUnsupportedHeaders(omittedFields, 'wsHeaders', node.wsHeaders)
  }
  addTlsQuery(query, node, omittedFields, {
    certificateKey: 'pcs',
    fingerprint: true,
    insecureKeys: ['allowInsecure', 'insecure'],
  })
  addOmittedField(omittedFields, 'multiplex', node.multiplex)

  return {
    uri: createUri(
      'trojan',
      node.password,
      node.hostname,
      node.port,
      query,
      node.nodeName,
    ),
    omittedFields,
  }
}

const serializeHysteria2 = (
  node: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Hysteria2 }>,
): SerializedNode => {
  const omittedFields: string[] = []
  const query = new URLSearchParams()
  if (node.sni) query.set('sni', node.sni)
  if (node.alpn) query.set('alpn', node.alpn.join(','))
  if (node.skipCertVerify) query.set('insecure', '1')
  if (node.serverCertFingerprintSha256) {
    query.set('pinSHA256', node.serverCertFingerprintSha256)
  }
  if (node.obfs === 'salamander') {
    query.set('obfs', 'salamander')
    if (node.obfsPassword) query.set('obfs-password', node.obfsPassword)
  }
  if (node.portHopping) {
    query.set(
      'mport',
      node.portHopping.replaceAll(';', ',').replaceAll(':', '-'),
    )
  }

  addOmittedField(omittedFields, 'clientFingerprint', node.clientFingerprint)
  addOmittedField(omittedFields, 'tls13', node.tls13)
  addOmittedField(omittedFields, 'uploadBandwidth', node.uploadBandwidth)
  addOmittedField(omittedFields, 'downloadBandwidth', node.downloadBandwidth)
  addOmittedField(
    omittedFields,
    'portHoppingInterval',
    node.portHoppingInterval,
  )

  return {
    uri: createUri(
      'hysteria2',
      node.password,
      node.hostname,
      node.port,
      query,
      node.nodeName,
    ),
    omittedFields,
  }
}

const serializeTuic = (
  node: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Tuic }>,
): SerializedNode => {
  const omittedFields: string[] = []
  const query = new URLSearchParams()
  if (node.sni) query.set('sni', node.sni)
  if (node.alpn) query.set('alpn', node.alpn.join(','))
  if (node.skipCertVerify) query.set('allow_insecure', '1')
  if (node.congestionControl) {
    query.set('congestion_control', node.congestionControl)
  }

  addOmittedField(omittedFields, 'clientFingerprint', node.clientFingerprint)
  addOmittedField(
    omittedFields,
    'serverCertFingerprintSha256',
    node.serverCertFingerprintSha256,
  )
  addOmittedField(omittedFields, 'tls13', node.tls13)
  addOmittedField(omittedFields, 'portHopping', node.portHopping)
  addOmittedField(
    omittedFields,
    'portHoppingInterval',
    node.portHoppingInterval,
  )

  const userInfo =
    'version' in node
      ? `${encodeURIComponent(node.uuid)}:${encodeURIComponent(node.password)}`
      : encodeURIComponent(node.token)
  return {
    uri: createUri(
      'tuic',
      userInfo,
      node.hostname,
      node.port,
      query,
      node.nodeName,
      false,
    ),
    omittedFields,
  }
}

const parseWireguardEndpoint = (
  endpoint: string,
): { hostname: string; port: string } | undefined => {
  const bracketed = /^\[([^\]]+)]:(\d+)$/.exec(endpoint)
  if (bracketed) return { hostname: bracketed[1], port: bracketed[2] }
  const regular = /^(.*):(\d+)$/.exec(endpoint)
  if (!regular) return undefined
  return { hostname: regular[1], port: regular[2] }
}

const serializeWireguard = (
  node: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.Wireguard }>,
): SerializedNode | undefined => {
  const peer = node.peers[0]
  const endpoint = parseWireguardEndpoint(peer.endpoint)
  if (!endpoint) return undefined

  const omittedFields: string[] = []
  const query = new URLSearchParams()
  query.set('publickey', peer.publicKey)
  if (peer.presharedKey) query.set('presharedkey', peer.presharedKey)
  const reservedBits = peer.reservedBits ?? node.reservedBits
  if (reservedBits) query.set('reserved', reservedBits.join(','))
  const addresses = [
    `${node.selfIp}/32`,
    ...(node.selfIpV6 ? [`${node.selfIpV6}/128`] : []),
  ]
  query.set('address', addresses.join(','))
  if (node.mtu) query.set('mtu', String(node.mtu))
  if (node.dnsServers) query.set('dns', node.dnsServers.join(','))

  if (node.peers.length > 1) omittedFields.push('peers[1..]')
  addOmittedField(omittedFields, 'peers[0].allowedIps', peer.allowedIps)
  addOmittedField(omittedFields, 'peers[0].keepalive', peer.keepalive)
  addOmittedField(omittedFields, 'preferIpv6', node.preferIpv6)

  return {
    uri: createUri(
      'wireguard',
      node.privateKey,
      endpoint.hostname,
      endpoint.port,
      query,
      node.nodeName,
    ),
    omittedFields,
  }
}

const serializeAnyTls = (
  node: Extract<PossibleNodeConfigType, { type: NodeTypeEnum.AnyTLS }>,
): SerializedNode => {
  const omittedFields: string[] = []
  const query = new URLSearchParams({ type: 'tcp' })
  addTlsQuery(query, node, omittedFields, {
    certificateKey: 'pcs',
    fingerprint: true,
    insecureKeys: ['insecure'],
    security: node.realityOpts ? 'reality' : 'tls',
  })
  if (node.realityOpts) {
    query.set('pbk', node.realityOpts.publicKey)
    if (node.realityOpts.shortId) query.set('sid', node.realityOpts.shortId)
  }

  addOmittedField(
    omittedFields,
    'idleSessionCheckInterval',
    node.idleSessionCheckInterval,
  )
  addOmittedField(omittedFields, 'idleSessionTimeout', node.idleSessionTimeout)
  addOmittedField(omittedFields, 'minIdleSessions', node.minIdleSessions)
  addOmittedField(omittedFields, 'reuse', node.reuse)

  return {
    uri: createUri(
      'anytls',
      node.password,
      node.hostname,
      node.port,
      query,
      node.nodeName,
    ),
    omittedFields,
  }
}

const serializeHttp = (
  node: Extract<
    PossibleNodeConfigType,
    { type: NodeTypeEnum.HTTP | NodeTypeEnum.HTTPS }
  >,
): SerializedNode => {
  const omittedFields: string[] = []
  const profile: Record<string, unknown> = {
    ConfigVersion: 4,
    ConfigType: 10,
    Remarks: node.nodeName,
    Address: node.hostname,
    Port: node.port,
    ...(node.username ? { Username: node.username } : null),
    ...(node.password ? { Password: node.password } : null),
  }

  if (node.type === NodeTypeEnum.HTTPS) {
    profile.StreamSecurity = 'tls'
    if (node.sni) profile.Sni = node.sni
    if (node.alpn) profile.Alpn = node.alpn.join(',')
    if (node.clientFingerprint) profile.Fingerprint = node.clientFingerprint
    if (node.serverCertFingerprintSha256) {
      profile.CertSha = node.serverCertFingerprintSha256
    }
    if (node.skipCertVerify) profile.AllowInsecure = true
    addOmittedField(omittedFields, 'tls13', node.tls13)
  }

  addOmittedField(omittedFields, 'path', node.path)
  addOmittedField(omittedFields, 'headers', node.headers)

  return {
    uri: `v2rayn://http/${toUrlSafeBase64(JSON.stringify(profile))}`,
    omittedFields,
  }
}

const serializeNode = (
  node: PossibleNodeConfigType,
): SerializedNode | undefined => {
  switch (node.type) {
    case NodeTypeEnum.Vmess:
      return serializeVmess(node)
    case NodeTypeEnum.Shadowsocks:
      return serializeShadowsocks(node)
    case NodeTypeEnum.Socks5:
      return serializeSocks(node)
    case NodeTypeEnum.Vless:
      return serializeVless(node)
    case NodeTypeEnum.Trojan:
      return serializeTrojan(node)
    case NodeTypeEnum.Hysteria2:
      return serializeHysteria2(node)
    case NodeTypeEnum.Tuic:
      return serializeTuic(node)
    case NodeTypeEnum.Wireguard:
      return serializeWireguard(node)
    case NodeTypeEnum.AnyTLS:
      return serializeAnyTls(node)
    case NodeTypeEnum.HTTP:
    case NodeTypeEnum.HTTPS:
      return serializeHttp(node)
    default:
      return undefined
  }
}

export const getV2rayNNodes = (
  nodeList: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  options: FormatterOptions = {},
): string => {
  const logger = options.logger ?? defaultLogger
  const result: string[] = []

  for (const node of applyFilter(nodeList, filter)) {
    const serialized = serializeNode(node)
    if (!serialized) {
      logger.warn(
        `V2rayN 订阅格式不支持 ${node.type} 节点，节点 ${node.nodeName} 会被省略。`,
      )
      continue
    }
    if (serialized.omittedFields?.length) {
      logger.warn(
        `生成 V2rayN 节点 ${node.nodeName} 时省略了无法表达的字段：${serialized.omittedFields.join(
          ', ',
        )}。`,
      )
    }
    result.push(serialized.uri)
  }

  return result.join('\n')
}
