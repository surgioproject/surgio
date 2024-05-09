import os from 'os'
import { join } from 'path'
import { URL, URLSearchParams } from 'url'
import net from 'net'
import crypto from 'crypto'
import URLSafeBase64 from 'urlsafe-base64'
import queryString from 'query-string'
import fs from 'fs-extra'
import { createLogger } from '@surgio/logger'
import { camelCase, snakeCase, paramCase } from 'change-case'

import {
  NodeFilterType,
  NodeTypeEnum,
  PossibleNodeConfigType,
  ShadowsocksNodeConfig,
  ShadowsocksrNodeConfig,
  SortedNodeFilterType,
  VmessNodeConfig,
} from '../types'
import { ERR_INVALID_FILTER, V2RAYN_SUPPORTED_VMESS_NETWORK } from '../constant'
import { applyFilter } from '../filters'

import { getIsGFWFree } from './env-flag'

export * from './surge'
export * from './surfboard'
export * from './clash'
export * from './singbox'
export * from './quantumult'
export * from './loon'
export * from './remote-snippet'
export * from './subscription'
export * from './time'
export * from './errors'
export * from './env-flag'
export { default as httpClient } from './http-client'

const logger = createLogger({ service: 'surgio:utils' })

export const getDownloadUrl = (
  baseUrl = '/',
  artifactName: string,
  inline = true,
  accessToken?: string,
): string => {
  let urlSearchParams: URLSearchParams
  let name: string

  if (artifactName.includes('?')) {
    urlSearchParams = new URLSearchParams(artifactName.split('?')[1])
    name = artifactName.split('?')[0]
  } else {
    urlSearchParams = new URLSearchParams()
    name = artifactName
  }

  if (accessToken) {
    urlSearchParams.set('access_token', accessToken)
  }
  if (!inline) {
    urlSearchParams.set('dl', '1')
  }

  const query = urlSearchParams.toString()

  return `${baseUrl}${name}${query ? '?' + query : ''}`
}

export const getUrl = (
  baseUrl: string,
  path: string,
  accessToken?: string,
): string => {
  path = path.replace(/^\//, '')
  const url = new URL(path, baseUrl)
  if (accessToken) {
    url.searchParams.set('access_token', accessToken)
  }
  return url.toString()
}

// istanbul ignore next
export const toUrlSafeBase64 = (str: string): string =>
  URLSafeBase64.encode(Buffer.from(str, 'utf8'))

// istanbul ignore next
export const fromUrlSafeBase64 = (str: string): string => {
  if (URLSafeBase64.validate(str)) {
    return URLSafeBase64.decode(str).toString()
  }
  return fromBase64(str)
}

// istanbul ignore next
export const toBase64 = (str: string): string =>
  Buffer.from(str, 'utf8').toString('base64')

// istanbul ignore next
export const fromBase64 = (str: string): string =>
  Buffer.from(str, 'base64').toString('utf8')

// istanbul ignore next
export const toMD5 = (str: string): string =>
  crypto.createHash('md5').update(str).digest('hex')

/**
 * @see https://github.com/shadowsocks/shadowsocks-org/wiki/SIP002-URI-Scheme
 */
export const getShadowsocksNodes = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
  groupName = 'Surgio',
): string => {
  const result: ReadonlyArray<any> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return null
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const query: {
            readonly plugin?: string
            readonly group?: string
          } = {
            ...(nodeConfig.obfs
              ? {
                  plugin: `${encodeURIComponent(
                    `obfs-local;obfs=${nodeConfig.obfs};obfs-host=${nodeConfig.obfsHost}`,
                  )}`,
                }
              : null),
            ...(groupName ? { group: encodeURIComponent(groupName) } : null),
          }

          return [
            'ss://',
            toUrlSafeBase64(`${nodeConfig.method}:${nodeConfig.password}`),
            '@',
            nodeConfig.hostname,
            ':',
            nodeConfig.port,
            '/?',
            queryString.stringify(query, {
              encode: false,
              sort: false,
            }),
            '#',
            encodeURIComponent(nodeConfig.nodeName),
          ].join('')
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return null
      }
    })
    .filter((item) => !!item)

  return result.join('\n')
}

export const getShadowsocksrNodes = (
  list: ReadonlyArray<ShadowsocksrNodeConfig>,
  groupName: string,
): string => {
  const result: ReadonlyArray<string | undefined> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return void 0
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocksr: {
          const baseUri = [
            nodeConfig.hostname,
            nodeConfig.port,
            nodeConfig.protocol,
            nodeConfig.method,
            nodeConfig.obfs,
            toUrlSafeBase64(nodeConfig.password),
          ].join(':')
          const query = {
            obfsparam: toUrlSafeBase64(nodeConfig.obfsparam),
            protoparam: toUrlSafeBase64(nodeConfig.protoparam),
            remarks: toUrlSafeBase64(nodeConfig.nodeName),
            group: toUrlSafeBase64(groupName),
            udpport: 0,
            uot: 0,
          }

          return (
            'ssr://' +
            toUrlSafeBase64(
              [
                baseUri,
                '/?',
                queryString.stringify(query, {
                  encode: false,
                }),
              ].join(''),
            )
          )
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocksr 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return void 0
      }
    })
    .filter((item) => item !== undefined)

  return result.join('\n')
}

// https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
export const getV2rayNNodes = (
  list: ReadonlyArray<VmessNodeConfig>,
): string => {
  const result: ReadonlyArray<string> = list
    .map((nodeConfig): string | undefined => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return void 0
      }

      if (!V2RAYN_SUPPORTED_VMESS_NETWORK.includes(nodeConfig.network as any)) {
        logger.warn(
          `在生成 V2Ray 节点时出现了不被支持的 ${nodeConfig.network} 协议，节点 ${nodeConfig.nodeName} 会被省略`,
        )
        return void 0
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Vmess: {
          const json: Record<string, string> = {
            v: '2',
            ps: nodeConfig.nodeName,
            add: nodeConfig.hostname,
            port: `${nodeConfig.port}`,
            id: nodeConfig.uuid,
            aid: `${nodeConfig.alterId}` || '0',
            scy: nodeConfig.method,
            net: nodeConfig.network === 'http' ? 'tcp' : nodeConfig.network,
            type: nodeConfig.network === 'http' ? 'http' : 'none',
          }

          if (nodeConfig.tls) {
            json.tls = 'tls'

            if (nodeConfig.sni) {
              json.sni = nodeConfig.sni
            }
            if (nodeConfig.alpn) {
              json.alpn = nodeConfig.alpn.join(',')
            }
          }

          switch (nodeConfig.network) {
            case 'ws':
              if (nodeConfig.wsOpts) {
                const obfsHost = getHeader(nodeConfig.wsOpts.headers, 'host')
                json.path = nodeConfig.wsOpts.path

                if (obfsHost) {
                  json.host = obfsHost
                }
              }

              break
            case 'http':
              if (nodeConfig.httpOpts) {
                const obfsHost = getHeader(nodeConfig.httpOpts.headers, 'host')

                json.path = nodeConfig.httpOpts.path[0]

                if (obfsHost) {
                  json.host = obfsHost
                }
              }

              break
            case 'h2':
              if (nodeConfig.h2Opts) {
                json.path = nodeConfig.h2Opts.path
                json.host = nodeConfig.h2Opts.host[0]
              }

              break
            case 'grpc':
              if (nodeConfig.grpcOpts) {
                json.path = nodeConfig.grpcOpts.serviceName
              }

              break
          }

          return 'vmess://' + toBase64(JSON.stringify(json))
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 V2Ray 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return void 0
      }
    })
    .filter((item): item is string => item !== undefined)

  return result.join('\n')
}

// istanbul ignore next
export const getShadowsocksNodesJSON = (
  list: ReadonlyArray<ShadowsocksNodeConfig>,
): string => {
  const nodes: ReadonlyArray<any> = list
    .map((nodeConfig) => {
      // istanbul ignore next
      if (nodeConfig.enable === false) {
        return null
      }

      switch (nodeConfig.type) {
        case NodeTypeEnum.Shadowsocks: {
          const useObfs = Boolean(nodeConfig.obfs && nodeConfig.obfsHost)
          return {
            remarks: nodeConfig.nodeName,
            server: nodeConfig.hostname,
            server_port: nodeConfig.port,
            method: nodeConfig.method,
            remarks_base64: toUrlSafeBase64(nodeConfig.nodeName),
            password: nodeConfig.password,
            tcp_over_udp: false,
            udp_over_tcp: false,
            enable: true,
            ...(useObfs
              ? {
                  plugin: 'obfs-local',
                  'plugin-opts': `obfs=${nodeConfig.obfs};obfs-host=${nodeConfig.obfsHost}`,
                }
              : null),
          }
        }

        // istanbul ignore next
        default:
          logger.warn(
            `在生成 Shadowsocks 节点时出现了 ${nodeConfig.type} 节点，节点 ${nodeConfig.nodeName} 会被省略`,
          )
          return undefined
      }
    })
    .filter((item) => item !== undefined)

  return JSON.stringify(nodes, null, 2)
}

export const getNodeNames = function (
  list: ReadonlyArray<PossibleNodeConfigType>,
  filter?: NodeFilterType | SortedNodeFilterType,
  separator?: string,
): string {
  // istanbul ignore next
  if (arguments.length === 2 && typeof filter === 'undefined') {
    throw new Error(ERR_INVALID_FILTER)
  }

  return applyFilter(list, filter)
    .map((item) => item.nodeName)
    .join(separator || ', ')
}

// istanbul ignore next
export const changeCase = (
  str: string,
  format: 'camelCase' | 'snakeCase' | 'kebabCase',
): string => {
  switch (format) {
    case 'camelCase':
      return camelCase(str)
    case 'snakeCase':
      return snakeCase(str)
    case 'kebabCase':
      return paramCase(str)
  }
}

export const pickAndFormatStringList = (
  obj: Record<string, any>,
  keyList: readonly string[],
  options: {
    keyFormat?: 'camelCase' | 'snakeCase' | 'kebabCase'
    stringifyValue?: boolean
  } = {},
): readonly string[] => {
  const result: string[] = []
  const { keyFormat, stringifyValue } = options

  keyList.forEach((key) => {
    if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
      const propertyKey = keyFormat ? changeCase(key, keyFormat) : key
      const propertyValue = obj[key]

      if (Array.isArray(propertyValue)) {
        result.push(
          `${propertyKey}=${
            stringifyValue
              ? JSON.stringify(propertyValue.join(','))
              : propertyValue.join(',')
          }`,
        )
      } else {
        result.push(
          `${propertyKey}=${
            stringifyValue ? JSON.stringify(propertyValue) : propertyValue
          }`,
        )
      }
    }
  })

  return result
}

export const pickAndFormatKeys = (
  obj: Record<string, any>,
  keyList: readonly string[],
  options: {
    keyFormat?: 'camelCase' | 'snakeCase' | 'kebabCase'
  } = {},
): Record<string, any> => {
  const result: Record<string, any> = {}

  keyList.forEach((key) => {
    if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
      const propertyKey = options.keyFormat
        ? changeCase(key, options.keyFormat)
        : key
      result[propertyKey] = obj[key]
    }
  })

  return result
}

export const decodeStringList = <T = Record<string, string | boolean>>(
  stringList: ReadonlyArray<string>,
): T => {
  const result: Record<string, any> = {}

  stringList.forEach((item) => {
    if (item.includes('=')) {
      const match = item.match(/^(.*?)=(.*?)$/)

      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        result[key] = value || true
      }
    } else {
      result[item.trim()] = true
    }
  })
  return result as T
}

export const ensureConfigFolder = (dir: string = os.homedir()): string => {
  let baseDir

  try {
    fs.accessSync(dir, fs.constants.W_OK)
    baseDir = dir
  } catch (err) {
    // if the user do not have write permission
    // istanbul ignore next
    baseDir = '/tmp'
  }

  const configDir = join(baseDir, '.config/surgio')
  fs.mkdirpSync(configDir)
  return configDir
}

export const lowercaseHeaderKeys = (
  headers: Record<string, string>,
): Record<string, string> => {
  const wsHeaders: Record<string, string> = {}

  Object.keys(headers).forEach((key) => {
    wsHeaders[key.toLowerCase()] = headers[key]
  })

  return wsHeaders
}

// istanbul ignore next
export const isIp = (str: string): boolean => net.isIPv4(str) || net.isIPv6(str)

// istanbul ignore next
export const isNow = (): boolean =>
  typeof process.env.NOW_REGION !== 'undefined' ||
  typeof process.env.VERCEL_REGION !== 'undefined'

// istanbul ignore next
export const isVercel = (): boolean => isNow()

// istanbul ignore next
export const isHeroku = (): boolean => typeof process.env.DYNO !== 'undefined'

// istanbul ignore next
export const isGitHubActions = (): boolean =>
  typeof process.env.GITHUB_ACTIONS !== 'undefined'

// istanbul ignore next
export const isGitLabCI = (): boolean =>
  typeof process.env.GITLAB_CI !== 'undefined'

// istanbul ignore next
export const isRailway = (): boolean =>
  typeof process.env.RAILWAY_STATIC_URL !== 'undefined'

// istanbul ignore next
export const isNetlify = (): boolean =>
  typeof process.env.NETLIFY !== 'undefined'

// istanbul ignore next
export const isAWSLambda = (): boolean =>
  typeof process.env.AWS_LAMBDA_FUNCTION_NAME !== 'undefined'

// istanbul ignore next
export const isAWS = (): boolean =>
  isAWSLambda() ||
  typeof process.env.AWS_EXECUTION_ENV !== 'undefined' ||
  typeof process.env.AWS_REGION !== 'undefined'

// istanbul ignore next
export const isFlyIO = (): boolean =>
  typeof process.env.FLY_REGION !== 'undefined'

// istanbul ignore next
export const isGFWFree = (): boolean =>
  getIsGFWFree() ||
  isAWS() ||
  isAWSLambda() ||
  isVercel() ||
  isHeroku() ||
  isGitHubActions() ||
  isGitLabCI() ||
  isRailway() ||
  isNetlify() ||
  isFlyIO()

export const checkNotNullish = (val: unknown): boolean =>
  val !== null && val !== undefined

export const getPortFromHost = (host: string): number => {
  const match = host.match(/:(\d+)$/)
  if (match) {
    return Number(match[1])
  }
  throw new Error(`Invalid host: ${host}`)
}

export const getHostnameFromHost = (host: string): string => {
  const match = host.match(/^(.*?):/)
  if (match) {
    return match[1]
  }
  throw new Error(`Invalid host: ${host}`)
}

/**
 * Returned value must be in Mbps
 *
 * Input value can be:
 * - 1.2 Mbps
 * - 1.2
 * - 1200
 * - 1200 Kbps
 * - 1.2 Gbps
 * Return value will be:
 * - 1.2
 * - 1.2
 * - 1.2
 * - 1.2
 * - 1200
 */
export const parseBitrate = (input: string | number): number => {
  const inputStr = typeof input === 'number' ? `${input} Mbps` : input

  const match = inputStr.match(/^(\d+(?:\.\d+)?)\s*(?:Mbps|Kbps|Gbps)?$/)

  if (!match) {
    throw new Error(`Invalid bitrate: ${inputStr}`)
  }

  const bitrate = Number(match[1])

  if (inputStr.includes('Gbps')) {
    return bitrate * 1000
  } else if (inputStr.includes('Kbps')) {
    return bitrate / 1000
  } else {
    return bitrate
  }
}

export const getHeader = (
  headers: Record<string, string> | undefined,
  key: string,
): string | undefined => {
  if (!headers) {
    return undefined
  }

  const lowerCaseKey = key.toLowerCase()
  const headerKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === lowerCaseKey,
  )

  return headerKey ? headers[headerKey] : undefined
}
