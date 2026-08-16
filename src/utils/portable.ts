import crypto from 'node:crypto'
import net from 'node:net'
import { camelCase, kebabCase, snakeCase } from 'change-case'

import {
  ERR_INVALID_FILTER,
  V2RAYN_SUPPORTED_VMESS_NETWORK,
} from '../constant/index.js'
import { applyFilter } from '../filters/index.js'
import { NodeTypeEnum } from '../types.js'

import type {
  NodeFilterType,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SortedNodeFilterType,
  VmessNodeConfig,
} from '../types.js'

export const getDownloadUrl = (
  baseUrl = '/',
  artifactName: string,
  inline = true,
  accessToken?: string,
): string => {
  const [name, queryString = ''] = artifactName.split('?', 2)
  const params = new URLSearchParams(queryString)
  if (accessToken) params.set('access_token', accessToken)
  if (!inline) params.set('dl', '1')
  const query = params.toString()
  return `${baseUrl}${name}${query ? `?${query}` : ''}`
}

export const getUrl = (
  baseUrl: string,
  path: string,
  accessToken?: string,
): string => {
  const url = new URL(path.replace(/^\//, ''), baseUrl)
  if (accessToken) url.searchParams.set('access_token', accessToken)
  return url.toString()
}

export const toBase64 = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64')

export const fromBase64 = (value: string): string =>
  Buffer.from(value, 'base64').toString('utf8')

export const toUrlSafeBase64 = (value: string): string =>
  toBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

export const fromUrlSafeBase64 = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  return fromBase64(
    normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='),
  )
}

export const toMD5 = (value: string): string =>
  crypto.createHash('md5').update(value).digest('hex')

export const getShadowsocksNodes = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
  groupName = 'Surgio',
): string =>
  list
    .filter(
      (node) => node.enable !== false && node.type === NodeTypeEnum.Shadowsocks,
    )
    .map((node) => {
      const params = new URLSearchParams()
      if (node.obfs) {
        params.set(
          'plugin',
          `obfs-local;obfs=${node.obfs};obfs-host=${node.obfsHost}`,
        )
      }
      if (groupName) params.set('group', groupName)
      return `ss://${toUrlSafeBase64(`${node.method}:${node.password}`)}@${
        node.hostname
      }:${node.port}/?${params.toString()}#${encodeURIComponent(node.nodeName)}`
    })
    .join('\n')

export const getShadowsocksrNodes = (
  list: ReadonlyArray<ShadowsocksrNodeConfig>,
  groupName = 'Surgio',
): string =>
  list
    .filter(
      (node) =>
        node.enable !== false && node.type === NodeTypeEnum.Shadowsocksr,
    )
    .map((node) => {
      const base = [
        node.hostname,
        node.port,
        node.protocol,
        node.method,
        node.obfs,
        toUrlSafeBase64(node.password),
      ].join(':')
      const params = new URLSearchParams({
        obfsparam: toUrlSafeBase64(node.obfsparam),
        protoparam: toUrlSafeBase64(node.protoparam),
        remarks: toUrlSafeBase64(node.nodeName),
        group: toUrlSafeBase64(groupName),
        udpport: '0',
        uot: '0',
      })
      return `ssr://${toUrlSafeBase64(`${base}/?${params.toString()}`)}`
    })
    .join('\n')

export const getV2rayNNodes = (list: ReadonlyArray<VmessNodeConfig>): string =>
  list
    .filter(
      (node) =>
        node.enable !== false &&
        node.type === NodeTypeEnum.Vmess &&
        V2RAYN_SUPPORTED_VMESS_NETWORK.includes(node.network as never),
    )
    .map((node) => {
      const output: Record<string, string> = {
        v: '2',
        ps: node.nodeName,
        add: node.hostname,
        port: String(node.port),
        id: node.uuid,
        aid: String(node.alterId ?? 0),
        scy: node.method,
        net: node.network === 'http' ? 'tcp' : node.network,
        type: node.network === 'http' ? 'http' : 'none',
      }
      if (node.tls) {
        output.tls = 'tls'
        if (node.sni) output.sni = node.sni
        if (node.alpn) output.alpn = node.alpn.join(',')
      }
      if (node.network === 'ws' && node.wsOpts) {
        output.path = node.wsOpts.path
        output.host = getHeader(node.wsOpts.headers, 'host') ?? ''
      } else if (node.network === 'http' && node.httpOpts) {
        output.path = node.httpOpts.path[0]
        output.host = getHeader(node.httpOpts.headers, 'host') ?? ''
      } else if (node.network === 'h2' && node.h2Opts) {
        output.path = node.h2Opts.path
        output.host = node.h2Opts.host[0]
      } else if (node.network === 'grpc' && node.grpcOpts) {
        output.path = node.grpcOpts.serviceName
      }
      return `vmess://${toBase64(JSON.stringify(output))}`
    })
    .join('\n')

export const getShadowsocksNodesJSON = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
): string =>
  JSON.stringify(
    list
      .filter(
        (node) =>
          node.enable !== false && node.type === NodeTypeEnum.Shadowsocks,
      )
      .map((node) => ({
        remarks: node.nodeName,
        server: node.hostname,
        server_port: node.port,
        method: node.method,
        remarks_base64: toUrlSafeBase64(node.nodeName),
        password: node.password,
        tcp_over_udp: false,
        udp_over_tcp: false,
        enable: true,
        ...(node.obfs && node.obfsHost
          ? {
              plugin: 'obfs-local',
              'plugin-opts': `obfs=${node.obfs};obfs-host=${node.obfsHost}`,
            }
          : {}),
      })),
    null,
    2,
  )

export function getNodeNames(
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  separator = ', ',
): string {
  if (arguments.length === 2 && filter === undefined) {
    throw new Error(ERR_INVALID_FILTER)
  }
  return applyFilter(list, filter)
    .map((item) => item.nodeName)
    .join(separator)
}

export const changeCase = (
  value: string,
  format: 'camelCase' | 'snakeCase' | 'kebabCase',
): string => ({ camelCase, snakeCase, kebabCase })[format](value)

export const pickAndFormatStringList = (
  value: object,
  keys: readonly string[],
  options: {
    keyFormat?: 'camelCase' | 'snakeCase' | 'kebabCase'
    stringifyValue?: boolean
  } = {},
): readonly string[] => {
  const record = value as Record<string, unknown>
  return keys.flatMap((key) => {
    const item = record[key]
    if (!Object.hasOwn(record, key) || item === undefined) return []
    const outputKey = options.keyFormat
      ? changeCase(key, options.keyFormat)
      : key
    const outputValue = Array.isArray(item) ? item.join(',') : item
    return `${outputKey}=${
      options.stringifyValue ? JSON.stringify(outputValue) : String(outputValue)
    }`
  })
}

export const pickAndFormatKeys = (
  value: object,
  keys: readonly string[],
  options: { keyFormat?: 'camelCase' | 'snakeCase' | 'kebabCase' } = {},
): Record<string, unknown> => {
  const record = value as Record<string, unknown>
  return Object.fromEntries(
    keys.flatMap((key) => {
      if (!Object.hasOwn(record, key) || record[key] === undefined) return []
      return [
        [
          options.keyFormat ? changeCase(key, options.keyFormat) : key,
          record[key],
        ],
      ]
    }),
  )
}

export const decodeStringList = <T = Record<string, string | boolean>>(
  values: ReadonlyArray<string>,
): T =>
  Object.fromEntries(
    values.map((item) => {
      const separator = item.indexOf('=')
      return separator < 0
        ? [item.trim(), true]
        : [
            item.slice(0, separator).trim(),
            item.slice(separator + 1).trim() || true,
          ]
    }),
  ) as T

export const lowercaseHeaderKeys = (
  headers: Record<string, string>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

export const isIp = (value: string): boolean => net.isIP(value) !== 0
export const checkNotNullish = (value: unknown): boolean =>
  value !== null && value !== undefined

export const getPortFromHost = (host: string): number => {
  const match = host.match(/:(\d+)$/)
  if (!match) throw new Error(`Invalid host: ${host}`)
  return Number(match[1])
}

export const getHostnameFromHost = (host: string): string => {
  const match = host.match(/^(.*?):/)
  if (!match) throw new Error(`Invalid host: ${host}`)
  return match[1]
}

export const getHeader = (
  headers: Record<string, string> | undefined,
  key: string,
): string | undefined => {
  const target = key.toLowerCase()
  const entry = Object.entries(headers ?? {}).find(
    ([header]) => header.toLowerCase() === target,
  )
  return entry?.[1]
}

export const parseBitrate = (input: string | number): number => {
  const value = typeof input === 'number' ? `${input} Mbps` : input
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(?:Mbps|Kbps|Gbps)?$/)
  if (!match) throw new Error(`Invalid bitrate: ${value}`)
  const bitrate = Number(match[1])
  if (value.includes('Gbps')) return bitrate * 1000
  if (value.includes('Kbps')) return bitrate / 1000
  return bitrate
}
